import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ingredientService, leftoverService } from '../lib/database';
import { Card } from '../components/ui/Card';
import { ExpirationMonitor } from '../components/ui/ExpirationMonitor';
import { LowStockAlert } from '../components/ui/LowStockAlert';
import { ProactiveSuggestions } from '../components/ui/ProactiveSuggestions';
import { ChefHat, Package, AlertTriangle, TrendingUp } from 'lucide-react';
import type { Ingredient, Leftover } from '../types';

export default function Dashboard() {
  const { user } = useAuth();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [leftovers, setLeftovers] = useState<Leftover[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalIngredients: 0,
    expiringItems: 0,
    lowStockItems: 0,
    totalLeftovers: 0
  });

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [ingredientsData, leftoversData] = await Promise.all([
        ingredientService.getIngredients(),
        leftoverService.getLeftovers()
      ]);

      setIngredients(ingredientsData);
      setLeftovers(leftoversData);

      // Calculate stats
      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      
      const expiringItems = ingredientsData.filter(item => 
        item.expiration_date && new Date(item.expiration_date) <= threeDaysFromNow
      ).length;

      const lowStockItems = ingredientsData.filter(item => 
        item.quantity !== null && 
        item.low_stock_threshold !== null && 
        item.quantity <= item.low_stock_threshold
      ).length;

      setStats({
        totalIngredients: ingredientsData.length,
        expiringItems,
        lowStockItems,
        totalLeftovers: leftoversData.length
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to SmartRecipe</h2>
          <p className="text-gray-600">Please sign in to access your dashboard</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's what's happening in your kitchen.</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Package className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Ingredients</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalIngredients}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
              <p className="text-2xl font-bold text-gray-900">{stats.expiringItems}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-gray-900">{stats.lowStockItems}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ChefHat className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Leftovers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalLeftovers}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Alerts and Monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <ExpirationMonitor ingredients={ingredients} />
          <LowStockAlert ingredients={ingredients} />
        </div>
        
        <div>
          <ProactiveSuggestions 
            ingredients={ingredients}
            leftovers={leftovers}
          />
        </div>
      </div>
    </div>
  );
}