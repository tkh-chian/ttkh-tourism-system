const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    product_number: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    title_zh: {
      type: DataTypes.STRING,
      allowNull: false
    },
    title_th: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description_zh: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    description_th: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    base_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    poster_image: {
      type: DataTypes.TEXT('long'),
      allowNull: true
    },
    poster_filename: {
      type: DataTypes.STRING,
      allowNull: true
    },
    pdf_file: {
      type: DataTypes.TEXT('long'),
      allowNull: true
    },
    pdf_filename: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // 保留旧字段以兼容原有功能
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true
    },
    duration: {
      type: DataTypes.STRING,
      allowNull: true
    },
    max_participants: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    images: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const value = this.getDataValue('images');
        return value ? JSON.parse(value) : [];
      },
      set(value) {
        this.setDataValue('images', JSON.stringify(value || []));
      }
    },
    status: {
      type: DataTypes.ENUM('draft', 'pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'draft'
    },
    merchant_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    view_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    tableName: 'products',
    timestamps: true
  });

  return Product;
};