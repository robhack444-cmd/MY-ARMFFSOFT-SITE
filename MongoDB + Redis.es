// MongoDB Schemas with Optimization
const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        index: true,
        text: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        currency: {
            type: String,
            default: 'USD',
            enum: ['USD', 'EUR', 'GBP', 'RUB']
        },
        discount: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        }
    },
    features: [{
        name: String,
        value: String,
        premium: {
            type: Boolean,
            default: false
        }
    }],
    systemRequirements: {
        android: {
            minVersion: String,
            storage: Number,
            ram: Number
        },
        ios: {
            minVersion: String,
            storage: Number
        }
    },
    images: {
        main: String,
        gallery: [String],
        thumbnails: [String]
    },
    statistics: {
        sales: {
            type: Number,
            default: 0
        },
        rating: {
            average: {
                type: Number,
                min: 0,
                max: 5,
                default: 0
            },
            count: {
                type: Number,
                default: 0
            }
        },
        downloads: {
            type: Number,
            default: 0
        }
    },
    aiData: {
        embeddings: [Number],
        similarityScores: Map,
        trendScore: Number
    },
    security: {
        checksum: String,
        digitalSignature: String,
        lastVerified: Date
    },
    metadata: {
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: {
            type: Date,
            default: Date.now
        },
        version: {
            type: String,
            default: '1.0.0'
        },
        changelog: [{
            version: String,
            changes: [String],
            date: Date
        }]
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for Performance
productSchema.index({ 'price.amount': 1 });
productSchema.index({ 'statistics.rating.average': -1 });
productSchema.index({ 'statistics.sales': -1 });
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ 'aiData.trendScore': -1 });