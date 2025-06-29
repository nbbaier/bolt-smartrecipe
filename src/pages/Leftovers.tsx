import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { leftoverService } from "../lib/database";
import { LeftoverCard } from "../components/ui/LeftoverCard";
import { LeftoverForm } from "../components/ui/LeftoverForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import {
  Package,
  Plus,
  Search,
  Calendar,
  AlertTriangle,
  Clock,
  ChefHat,
} from "lucide-react";
import type { Leftover } from "../types";

export function Leftovers() {
  const { user } = useAuth();
  const [leftovers, setLeftovers] = useState<Leftover[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLeftover, setEditingLeftover] = useState<Leftover | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadLeftovers();
    }
  }, [user]);

  const loadLeftovers = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await leftoverService.getAll(user.id);
      setLeftovers(data);
    } catch (error) {
      console.error("Error loading leftovers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: Omit<Leftover, "id" | "created_at" | "updated_at">) => {
    try {
      setSaving(true);
      if (editingLeftover) {
        await leftoverService.update(editingLeftover.id, data);
      } else {
        await leftoverService.create(data);
      }
      await loadLeftovers();
      resetForm();
    } catch (error) {
      console.error("Error saving leftover:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this leftover?")) return;

    try {
      await leftoverService.delete(id);
      await loadLeftovers();
    } catch (error) {
      console.error("Error deleting leftover:", error);
    }
  };

  const resetForm = () => {
    setShowAddForm(false);
    setEditingLeftover(null);
  };

  const startEdit = (leftover: Leftover) => {
    setEditingLeftover(leftover);
    setShowAddForm(true);
  };

  const getDaysUntilExpiration = (expirationDate: string | undefined) => {
    if (!expirationDate) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(expirationDate);
    expDate.setHours(0, 0, 0, 0);
    
    const diffTime = expDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const filteredLeftovers = leftovers.filter((leftover) =>
    leftover.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Categorize leftovers by expiration status
  const expiredLeftovers = filteredLeftovers.filter(leftover => {
    const days = getDaysUntilExpiration(leftover.expiration_date);
    return days !== null && days < 0;
  });

  const expiringSoonLeftovers = filteredLeftovers.filter(leftover => {
    const days = getDaysUntilExpiration(leftover.expiration_date);
    return days !== null && days >= 0 && days <= 2;
  });

  const freshLeftovers = filteredLeftovers.filter(leftover => {
    const days = getDaysUntilExpiration(leftover.expiration_date);
    return days === null || days > 2;
  });

  const totalExpiring = expiredLeftovers.length + expiringSoonLeftovers.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl font-bold text-secondary-900">Leftovers</h1>
          <p className="text-sm sm:text-base text-secondary-600">
            Track your leftovers and reduce food waste
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="flex items-center justify-center space-x-2 text-sm sm:text-base"
        >
          <Plus className="h-4 w-4" />
          <span>Add Leftover</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-secondary-600 truncate">
                  Total Leftovers
                </p>
                <p className="text-lg sm:text-2xl font-bold text-secondary-900">
                  {leftovers.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={totalExpiring > 0 ? "border-orange-200 bg-orange-50" : ""}>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className={`h-6 w-6 sm:h-8 sm:w-8 ${totalExpiring > 0 ? "text-orange-600" : "text-primary"}`} />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-secondary-600 truncate">
                  Expiring Soon
                </p>
                <p className="text-lg sm:text-2xl font-bold text-secondary-900">
                  {totalExpiring}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChefHat className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-secondary-600 truncate">
                  From Recipes
                </p>
                <p className="text-lg sm:text-2xl font-bold text-secondary-900">
                  {leftovers.filter(l => l.source_recipe_id).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
        <Input
          placeholder="Search leftovers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 text-sm sm:text-base"
        />
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">
              {editingLeftover ? "Edit Leftover" : "Add New Leftover"}
            </CardTitle>
            <CardDescription>
              Track your leftovers to reduce food waste and plan meals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LeftoverForm
              leftover={editingLeftover || undefined}
              onSubmit={handleSubmit}
              onCancel={resetForm}
              loading={saving}
            />
          </CardContent>
        </Card>
      )}

      {/* Leftovers Display */}
      {filteredLeftovers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8 sm:py-12">
            <Package className="h-10 w-10 sm:h-12 sm:w-12 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-secondary-900 mb-2">
              {searchTerm ? "No leftovers found" : "No leftovers yet"}
            </h3>
            <p className="text-sm sm:text-base text-secondary-600 mb-4 px-4">
              {searchTerm
                ? "Try adjusting your search criteria"
                : "Start tracking your leftovers to reduce food waste"}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowAddForm(true)} className="text-sm sm:text-base">
                Add Your First Leftover
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Expired Leftovers */}
          {expiredLeftovers.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-red-900 mb-3 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Expired ({expiredLeftovers.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {expiredLeftovers.map((leftover) => (
                  <LeftoverCard
                    key={leftover.id}
                    leftover={leftover}
                    onEdit={startEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Expiring Soon */}
          {expiringSoonLeftovers.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-orange-900 mb-3 flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Expiring Soon ({expiringSoonLeftovers.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {expiringSoonLeftovers.map((leftover) => (
                  <LeftoverCard
                    key={leftover.id}
                    leftover={leftover}
                    onEdit={startEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Fresh Leftovers */}
          {freshLeftovers.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-secondary-900 mb-3 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Fresh ({freshLeftovers.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {freshLeftovers.map((leftover) => (
                  <LeftoverCard
                    key={leftover.id}
                    leftover={leftover}
                    onEdit={startEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}