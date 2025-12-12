'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // This migration fixes the userId column in delivery_companies table
    // The column should be UUID but was created as INTEGER
    
    // First, we need to check the current state and fix if needed
    // For PostgreSQL, we can use a direct ALTER TABLE with USING to convert
    
    // Drop the foreign key constraint first
    try {
      await queryInterface.removeConstraint('delivery_companies', 'delivery_companies_userId_fkey');
    } catch (error) {
      console.log('Foreign key constraint not found, continuing...');
    }

    // Alter the column type from INTEGER to UUID
    // We need to cast the existing integer values to text then to UUID
    try {
      await queryInterface.sequelize.query(
        'ALTER TABLE delivery_companies ALTER COLUMN "userId" TYPE uuid USING ("userId"::text::uuid)'
      );
    } catch (error) {
      console.log('Column type change might have failed, checking current state...', error.message);
      // The column might already be UUID, which is fine
    }

    // Re-add the foreign key constraint
    try {
      await queryInterface.addConstraint('delivery_companies', {
        fields: ['userId'],
        type: 'foreign key',
        name: 'delivery_companies_userId_fkey',
        references: {
          table: 'users',
          field: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
    } catch (error) {
      console.log('Could not add constraint, it might already exist', error.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Rollback: This would revert the column back to INTEGER if needed
    // Not typically needed, but here for completeness
    try {
      await queryInterface.removeConstraint('delivery_companies', 'delivery_companies_userId_fkey');
    } catch (error) {
      console.log('Constraint removal failed');
    }

    try {
      await queryInterface.sequelize.query(
        'ALTER TABLE delivery_companies ALTER COLUMN "userId" TYPE integer'
      );
    } catch (error) {
      console.log('Rollback type change failed');
    }
  },
};
