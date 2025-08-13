const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true
    },
    order_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    product_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    merchant_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    agent_id: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    customer_id: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    product_title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    travel_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    adults: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    children_no_bed: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    children_with_bed: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    infants: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    total_people: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    customer_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    customer_phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    customer_email: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    unit_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    total_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    payment_status: {
      type: DataTypes.ENUM('pending', 'paid', 'refunded'),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'rejected', 'cancelled', 'completed'),
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    scan_document: {
      type: DataTypes.TEXT('long'),
      allowNull: true
    },
    scan_filename: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'orders',
    timestamps: true
  });

  return Order;
};