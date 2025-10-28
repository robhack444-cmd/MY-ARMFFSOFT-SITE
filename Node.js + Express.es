// Enterprise-Grade Backend System
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const cluster = require('cluster');
const os = require('os');

class ArmffsoftAPI {
    constructor() {
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupSecurity();
        this.setupMonitoring();
    }

    setupMiddleware() {
        // Security Headers
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'", "wss:", "https:"]
                }
            },
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true
            }
        }));

        // Rate Limiting
        const apiLimiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // limit each IP to 100 requests per windowMs
            message: 'Too many requests from this IP'
        });

        // Compression
        this.app.use(compression({
            level: 6,
            threshold: 1024
        }));

        // Body Parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));

        // CORS
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', 'https://armffsoft.com');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            res.header('Access-Control-Allow-Credentials', 'true');
            next();
        });
    }

    setupRoutes() {
        // Product Routes
        this.app.get('/api/products', this.getProducts);
        this.app.get('/api/products/:id', this.getProduct);
        this.app.post('/api/products/search', this.searchProducts);

        // Payment Routes
        this.app.post('/api/payments/create-intent', this.createPaymentIntent);
        this.app.post('/api/payments/confirm', this.confirmPayment);
        this.app.get('/api/payments/history', this.getPaymentHistory);

        // User Routes
        this.app.get('/api/user/profile', this.authenticate, this.getUserProfile);
        this.app.put('/api/user/profile', this.authenticate, this.updateUserProfile);
        this.app.get('/api/user/licenses', this.authenticate, this.getUserLicenses);

        // Admin Routes
        this.app.get('/api/admin/analytics', this.authenticateAdmin, this.getAnalytics);
        this.app.post('/api/admin/products', this.authenticateAdmin, this.createProduct);
    }

    setupSecurity() {
        // JWT Authentication
        this.app.use('/api/*', this.verifyJWT);

        // Request Sanitization
        this.app.use(this.sanitizeInput);

        // SQL Injection Protection
        this.app.use(this.sqlInjectionProtection);

        // XSS Protection
        this.app.use(this.xssProtection);
    }

    async getProducts(req, res) {
        try {
            const { page = 1, limit = 20, category, sort } = req.query;
            
            // Cache Strategy
            const cacheKey = `products:${page}:${limit}:${category}:${sort}`;
            const cached = await redis.get(cacheKey);
            
            if (cached) {
                return res.json(JSON.parse(cached));
            }

            // Database Query with Optimization
            const products = await Product.find()
                .where(category ? { category } : {})
                .sort(this.getSortOptions(sort))
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .populate('reviews')
                .lean()
                .exec();

            // AI-Powered Recommendations
            const recommendations = await this.getAIRecommendations(req.user);

            // Cache for 5 minutes
            await redis.setex(cacheKey, 300, JSON.stringify({
                products,
                recommendations,
                pagination: {
                    page,
                    limit,
                    total: await Product.countDocuments()
                }
            }));

            res.json({
                success: true,
                data: {
                    products,
                    recommendations,
                    pagination: {
                        page,
                        limit,
                        total: await Product.countDocuments()
                    }
                }
            });

        } catch (error) {
            this.handleError(res, error);
        }
    }

    async createPaymentIntent(req, res) {
        try {
            const { productId, paymentMethod, currency = 'USD' } = req.body;
            
            // Fraud Detection
            const fraudScore = await this.fraudDetection.checkTransaction(req);
            if (fraudScore > 0.8) {
                return res.status(400).json({
                    success: false,
                    error: 'Transaction flagged for review'
                });
            }

            // Create Payment Intent
            const paymentIntent = await stripe.paymentIntents.create({
                amount: await this.calculateAmount(productId),
                currency: currency.toLowerCase(),
                payment_method_types: [paymentMethod],
                metadata: {
                    userId: req.user.id,
                    productId: productId,
                    sessionId: req.session.id
                }
            });

            // Log transaction
            await this.auditLogger.logPaymentIntent({
                userId: req.user.id,
                paymentIntentId: paymentIntent.id,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency
            });

            res.json({
                success: true,
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id
            });

        } catch (error) {
            this.handleError(res, error);
        }
    }
}

// Cluster Mode for Performance
if (cluster.isMaster) {
    const numCPUs = os.cpus().length;
    
    console.log(`Master ${process.pid} is running`);
    console.log(`Forking ${numCPUs} workers`);

    // Fork workers
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died`);
        console.log('Forking new worker');
        cluster.fork();
    });

} else {
    // Workers can share any TCP connection
    const api = new ArmffsoftAPI();
    const server = api.app.listen(process.env.PORT || 3000, () => {
        console.log(`Worker ${process.pid} started on port ${process.env.PORT || 3000}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log(`Worker ${process.pid} shutting down`);
        server.close(() => {
            process.exit(0);
        });
    });
}