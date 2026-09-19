const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = 3000;

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'eventhub-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { httpOnly: false }
}));

// ============================================================
// Event Data (in-memory)
// ============================================================
const events = [
    {
        id: 1,
        name: 'Riyadh Tech Summit',
        category: 'Conference',
        city: 'Riyadh',
        date: '15 Jan 2027',
        price: 150.00,
        description: 'A full-day technology conference featuring keynote talks on cloud computing, cybersecurity, and software engineering trends.'
    },
    {
        id: 2,
        name: 'Jeddah Jazz Night',
        category: 'Music',
        city: 'Jeddah',
        date: '22 Jan 2027',
        price: 80.00,
        description: 'An open-air evening of live jazz performed by regional and international artists on the Jeddah waterfront.'
    },
    {
        id: 3,
        name: 'Desert Food Festival',
        category: 'Food',
        city: 'Al Kharj',
        date: '05 Feb 2027',
        price: 45.00,
        description: 'A weekend festival with more than 40 food stalls, live cooking shows, and traditional Saudi cuisine.'
    },
    {
        id: 4,
        name: 'AI Innovation Workshop',
        category: 'Workshop',
        city: 'Riyadh',
        date: '12 Feb 2027',
        price: 120.00,
        description: 'A hands-on workshop on building and evaluating machine learning models, with guided lab sessions.'
    },
    {
        id: 5,
        name: 'Eastern Football Cup Final',
        category: 'Sports',
        city: 'Dammam',
        date: '26 Feb 2027',
        price: 60.00,
        description: 'The final match of the Eastern Football Cup, including a pre-match fan zone and half-time show.'
    },
    {
        id: 6,
        name: 'Red Sea Comedy Show',
        category: 'Comedy',
        city: 'Jeddah',
        date: '05 Mar 2027',
        price: 200.00,
        description: 'A stand-up comedy night with five well-known comedians performing in Arabic and English.'
    }
];

// In-memory bookings storage
const bookings = [];

const PROMO_CODE = 'EVENT20';
const PROMO_PERCENT = 20;
const QUANTITY_ERROR = 'Quantity must be between 1 and 10';

// ============================================================
// Helpers
// ============================================================
function cartSubtotal(cart) {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function isValidQuantity(quantity) {
    return Number.isInteger(quantity) && quantity >= 1 && quantity < 10;
}

function checkoutSummary(req) {
    const cart = req.session.cart;
    const subtotal = cartSubtotal(cart);
    const discountPercent = req.session.discountPercent || 0;
    const discount = subtotal * discountPercent / 100;
    const total = subtotal - discount;
    return { cart, subtotal, discountPercent, discount, total };
}

// ============================================================
// Global Middleware
// ============================================================
app.use((req, res, next) => {
    if (!req.session.cart) {
        req.session.cart = [];
    }
    res.locals.cartCount = req.session.cart.reduce((sum, item) => sum + item.quantity, 0);
    next();
});

// ============================================================
// Routes
// ============================================================

// Home page - event listing
app.get('/', (req, res) => {
    res.render('index', { events });
});

// Search events
app.get('/search', (req, res) => {
    const query = req.query.q || '';
    const keyword = query.trim().toLowerCase();

    const results = events.filter(e =>
        e.name.toLowerCase().startsWith(keyword)
    );

    res.render('search', { query, results });
});

// Event detail page
app.get('/event/:id', (req, res) => {
    const event = events.find(e => e.id === parseInt(req.params.id));
    if (!event) {
        return res.status(404).send('Event not found');
    }
    res.render('event', { event, error: '', quantity: 1 });
});

// Add tickets to booking cart
app.post('/cart/add', (req, res) => {
    const eventId = parseInt(req.body.eventId);
    const event = events.find(e => e.id === eventId);

    if (!event) {
        return res.status(404).send('Event not found');
    }

    const quantity = Number(req.body.quantity);
    const existing = req.session.cart.find(item => item.id === event.id);
    const newQuantity = existing ? existing.quantity + quantity : quantity;

    if (!isValidQuantity(quantity) || !isValidQuantity(newQuantity)) {
        return res.render('event', { event, error: QUANTITY_ERROR, quantity: req.body.quantity });
    }

    if (existing) {
        existing.quantity = newQuantity;
    } else {
        req.session.cart.push({
            id: event.id,
            name: event.name,
            date: event.date,
            price: event.price,
            quantity
        });
    }

    res.redirect('/cart');
});

// View booking cart
app.get('/cart', (req, res) => {
    const cart = req.session.cart;
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    res.render('cart', { cart, total });
});

// Remove item from booking cart
app.post('/cart/remove', (req, res) => {
    const eventId = parseInt(req.body.eventId);
    req.session.cart = req.session.cart.filter(item => item.id !== eventId);
    if (req.session.cart.length === 0) {
        req.session.discountPercent = 0;
    }
    res.redirect('/cart');
});

// Checkout page
app.get('/checkout', (req, res) => {
    if (req.session.cart.length === 0) {
        return res.redirect('/cart');
    }
    res.render('checkout', { ...checkoutSummary(req), promoCode: '', error: '', message: '' });
});

// Apply promo code
app.post('/checkout/apply-promo', (req, res) => {
    if (req.session.cart.length === 0) {
        return res.redirect('/cart');
    }

    const promoCode = (req.body.promoCode || '').trim();
    let error = '';
    let message = '';

    if (promoCode.toUpperCase() === PROMO_CODE) {
        req.session.discountPercent = (req.session.discountPercent || 0) + PROMO_PERCENT;
        message = 'Promo code applied';
    } else {
        error = 'Invalid promo code';
    }

    res.render('checkout', { ...checkoutSummary(req), promoCode, error, message });
});

// Place order
app.post('/checkout/place-order', (req, res) => {
    if (req.session.cart.length === 0) {
        return res.redirect('/cart');
    }

    const { fullName, email, phone } = req.body;
    const { cart, subtotal, discountPercent, discount } = checkoutSummary(req);

    const booking = {
        reference: 'EVT-' + (bookings.length + 1001),
        customerName: fullName,
        email,
        phone,
        items: [...cart],
        subtotal,
        discountPercent,
        discount,
        total: subtotal,
        date: new Date().toISOString()
    };

    bookings.push(booking);
    req.session.cart = [];
    req.session.discountPercent = 0;

    res.render('confirmation', { booking });
});

// Login page
app.get('/login', (req, res) => {
    res.render('login', { error: '' });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
        req.session.isAdmin = true;
        res.redirect('/admin/bookings');
    } else {
        res.render('login', { error: 'Invalid username or password' });
    }
});

app.get('/admin/bookings', (req, res) => {
    res.render('admin/bookings', { bookings });
});

// ============================================================
// Start Server
// ============================================================
app.listen(PORT, () => {
    console.log(`EventHub is running at http://localhost:${PORT}`);
});
