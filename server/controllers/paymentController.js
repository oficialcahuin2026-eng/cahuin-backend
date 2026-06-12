const { MercadoPagoConfig, Preference } = require('mercadopago');
const {
  Environment,
  IntegrationApiKeys,
  IntegrationCommerceCodes,
  Options,
  WebpayPlus,
} = require('transbank-sdk');
const PaymentIntent = require('../models/PaymentIntent');
const User = require('../models/User');

const WEB_URL = process.env.CAHUIN_WEB_URL || 'http://localhost:3000';
const API_URL = process.env.CAHUIN_API_PUBLIC_URL || `http://localhost:${process.env.PORT || 5000}`;

const PRODUCTS = {
  cahuin_piola_monthly: {
    id: 'cahuin_piola_monthly',
    type: 'premium',
    tier: 'piola',
    title: 'Cahuin Piola mensual',
    amount: 3990,
    premiumDays: 30,
    features: [
      'Likes sin limite',
      'Retroceder cuando te equivocas',
      'Ruleta a Ciegas',
      'Modo Chile',
      'Sin anuncios',
    ],
  },
  cahuin_a_fondo_monthly: {
    id: 'cahuin_a_fondo_monthly',
    type: 'premium',
    tier: 'a_fondo',
    title: 'Cahuin a Fondo mensual',
    amount: 6990,
    premiumDays: 30,
    features: [
      'Todo lo de Cahuin Piola',
      'Ver quien te dio like',
      'La Pica',
      'Modo Destacado',
      'Salvar Match Relampago',
    ],
  },
};

const getProduct = (productId) => PRODUCTS[productId];

const makeBuyOrder = (userId) => `cw-${Date.now()}-${String(userId).slice(-6)}`;

const applyPurchase = async (intent) => {
  if (!intent || intent.appliedAt) return intent;
  const product = getProduct(intent.productId);
  if (!product) throw new Error('Producto invÃ¡lido');

  const user = await User.findById(intent.user);
  if (!user) throw new Error('Usuario no encontrado');

  if (product.type === 'premium') {
    const base = user.premiumHasta && user.premiumHasta > new Date() ? user.premiumHasta : new Date();
    const premiumHasta = new Date(base);
    premiumHasta.setDate(premiumHasta.getDate() + product.premiumDays);
    user.isPremium = true;
    user.premiumPlan = product.tier || 'gold';
    user.premiumHasta = premiumHasta;
  }

  await user.save();
  intent.status = 'approved';
  intent.appliedAt = new Date();
  await intent.save();
  return intent;
};

exports.getProducts = (req, res) => {
  res.json({ products: Object.values(PRODUCTS) });
};

exports.createMercadoPagoPreference = async (req, res) => {
  try {
    const product = getProduct(req.body.productId);
    if (!product) return res.status(400).json({ message: 'Producto invÃ¡lido' });

    const buyOrder = makeBuyOrder(req.user._id);
    const intent = await PaymentIntent.create({
      user: req.user._id,
      provider: 'mercadopago',
      productId: product.id,
      productType: product.type,
      title: product.title,
      amount: product.amount,
      buyOrder,
      sessionId: req.user._id.toString(),
    });

    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      intent.checkoutUrl = `${WEB_URL}/pago/resultado?provider=mercadopago&status=setup&intent=${intent._id}`;
      await intent.save();
      return res.json({
        provider: 'mercadopago',
        mode: 'setup',
        checkoutUrl: intent.checkoutUrl,
        message: 'Falta configurar MERCADOPAGO_ACCESS_TOKEN.',
      });
    }

    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
      options: { timeout: 5000 },
    });
    const preference = new Preference(client);
    const response = await preference.create({
      body: {
        items: [{
          id: product.id,
          title: product.title,
          quantity: 1,
          currency_id: 'CLP',
          unit_price: product.amount,
        }],
        payer: { email: req.user.email },
        external_reference: intent._id.toString(),
        back_urls: {
          success: `${WEB_URL}/pago/resultado?provider=mercadopago&status=success&intent=${intent._id}`,
          failure: `${WEB_URL}/pago/resultado?provider=mercadopago&status=failure&intent=${intent._id}`,
          pending: `${WEB_URL}/pago/resultado?provider=mercadopago&status=pending&intent=${intent._id}`,
        },
        notification_url: `${API_URL}/api/payments/mercadopago/webhook`,
        auto_return: 'approved',
      },
    });

    intent.providerReference = response.id;
    intent.checkoutUrl = response.init_point || response.sandbox_init_point;
    await intent.save();

    res.json({ provider: 'mercadopago', checkoutUrl: intent.checkoutUrl, preferenceId: response.id });
  } catch (error) {
    res.status(500).json({ message: error.message || 'No pudimos iniciar Mercado Pago' });
  }
};

const getWebpayTransaction = () => {
  if (process.env.WEBPAY_ENV === 'production') {
    const options = new Options(
      process.env.WEBPAY_COMMERCE_CODE,
      process.env.WEBPAY_API_KEY,
      Environment.Production
    );
    return new WebpayPlus.Transaction(options);
  }

  return WebpayPlus.Transaction.buildForIntegration(
    IntegrationCommerceCodes.WEBPAY_PLUS,
    IntegrationApiKeys.WEBPAY
  );
};

exports.createWebpayTransaction = async (req, res) => {
  try {
    const product = getProduct(req.body.productId);
    if (!product) return res.status(400).json({ message: 'Producto invÃ¡lido' });

    const buyOrder = makeBuyOrder(req.user._id);
    const intent = await PaymentIntent.create({
      user: req.user._id,
      provider: 'webpay',
      productId: product.id,
      productType: product.type,
      title: product.title,
      amount: product.amount,
      buyOrder,
      sessionId: req.user._id.toString(),
    });

    const transaction = getWebpayTransaction();
    const response = await transaction.create(
      buyOrder,
      intent.sessionId,
      product.amount,
      `${API_URL}/api/payments/webpay/commit`
    );

    intent.providerReference = response.token;
    intent.checkoutUrl = response.url;
    await intent.save();

    res.json({
      provider: 'webpay',
      token: response.token,
      url: response.url,
      checkoutUrl: `${response.url}?token_ws=${response.token}`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'No pudimos iniciar Webpay' });
  }
};

exports.commitWebpay = async (req, res) => {
  const token = req.body.token_ws || req.query.token_ws || req.body.TBK_TOKEN || req.query.TBK_TOKEN;
  if (!token) return res.redirect(`${WEB_URL}/pago/resultado?provider=webpay&status=failure`);

  try {
    const intent = await PaymentIntent.findOne({ provider: 'webpay', providerReference: token });
    if (!intent) return res.redirect(`${WEB_URL}/pago/resultado?provider=webpay&status=unknown`);

    const transaction = getWebpayTransaction();
    const result = await transaction.commit(token);
    intent.metadata = { ...(intent.metadata || {}), webpay: result };

    if (result.response_code === 0 && result.status === 'AUTHORIZED') {
      await applyPurchase(intent);
      return res.redirect(`${WEB_URL}/pago/resultado?provider=webpay&status=success&intent=${intent._id}`);
    }

    intent.status = 'rejected';
    await intent.save();
    res.redirect(`${WEB_URL}/pago/resultado?provider=webpay&status=failure&intent=${intent._id}`);
  } catch (error) {
    res.redirect(`${WEB_URL}/pago/resultado?provider=webpay&status=failure`);
  }
};

exports.mercadoPagoWebhook = async (req, res) => {
  try {
    const externalReference = req.body?.data?.external_reference || req.query?.external_reference;
    if (externalReference) {
      const intent = await PaymentIntent.findById(externalReference);
      if (intent && req.body?.action?.includes('approved')) await applyPurchase(intent);
    }
    res.sendStatus(200);
  } catch {
    res.sendStatus(200);
  }
};

exports.getIntent = async (req, res) => {
  try {
    const intent = await PaymentIntent.findOne({ _id: req.params.id, user: req.user._id });
    if (!intent) return res.status(404).json({ message: 'Pago no encontrado' });
    res.json({ intent });
  } catch {
    res.status(500).json({ message: 'No pudimos cargar el pago' });
  }
};
