import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, Camera, Package, Plus, X } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { Card } from './Card';
import { PhotoCapture } from './PhotoCapture';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const leftoverSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  quantity: z.number().min(0, 'Quantity must be positive').optional(),
  unit: z.string().optional(),
  expiration_date: z.string().optional(),
  source_recipe_id: z.string().uuid().optional(),
  notes: z.string().optional(),
});

type LeftoverFormData = z.infer<typeof leftoverSchema>;

interface LeftoverFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: Partial<LeftoverFormData>;
  sourceRecipeId?: string;
}

export function LeftoverForm({ 
  onSuccess, 
  onCancel, 
  initialData,
  sourceRecipeId 
}: LeftoverFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<LeftoverFormData>({
    resolver: zodResolver(leftoverSchema),
    defaultValues: {
      name: initialData?.name || '',
      quantity: initialData?.quantity || undefined,
      unit: initialData?.unit || '',
      expiration_date: initialData?.expiration_date || '',
      source_recipe_id: sourceRecipeId || initialData?.source_recipe_id || undefined,
      notes: initialData?.notes || '',
    },
  });

  const onSubmit = async (data: LeftoverFormData) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const leftoverData = {
        user_id: user.id,
        name: data.name,
        quantity: data.quantity || 0,
        unit: data.unit || '',
        expiration_date: data.expiration_date || null,
        source_recipe_id: data.source_recipe_id || null,
        notes: data.notes || '',
      };

      const { error } = await supabase
        .from('leftovers')
        .insert([leftoverData]);

      if (error) throw error;

      reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error adding leftover:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoCapture = (photoUrl: string) => {
    setCapturedPhoto(photoUrl);
    setShowPhotoCapture(false);
  };

  const handleQuickAdd = (name: string) => {
    setValue('name', name);
  };

  const quickAddSuggestions = [
    'Leftover pasta',
    'Cooked rice',
    'Roasted vegetables',
    'Soup',
    'Salad',
    'Bread',
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-emerald-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Add Leftover
          </h2>
        </div>
        {onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Quick Add Suggestions */}
      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-2">Quick add:</p>
        <div className="flex flex-wrap gap-2">
          {quickAddSuggestions.map((suggestion) => (
            <Button
              key={suggestion}
              variant="outline"
              size="sm"
              onClick={() => handleQuickAdd(suggestion)}
              className="text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              {suggestion}
            </Button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Leftover Name *
          </label>
          <Input
            {...register('name')}
            placeholder="e.g., Leftover pasta, Cooked rice"
            className={errors.name ? 'border-red-300' : ''}
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Quantity and Unit */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <Input
              type="number"
              step="0.01"
              {...register('quantity', { valueAsNumber: true })}
              placeholder="0"
              className={errors.quantity ? 'border-red-300' : ''}
            />
            {errors.quantity && (
              <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit
            </label>
            <Input
              {...register('unit')}
              placeholder="cups, servings, etc."
            />
          </div>
        </div>

        {/* Expiration Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Calendar className="w-4 h-4 inline mr-1" />
            Expiration Date
          </label>
          <Input
            type="date"
            {...register('expiration_date')}
            className="w-full"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            {...register('notes')}
            placeholder="Additional notes about this leftover..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
            rows={3}
          />
        </div>

        {/* Photo Capture */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Photo (Optional)
          </label>
          {!showPhotoCapture && !capturedPhoto && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPhotoCapture(true)}
              className="w-full"
            >
              <Camera className="w-4 h-4 mr-2" />
              Take Photo
            </Button>
          )}
          
          {showPhotoCapture && (
            <PhotoCapture
              onCapture={handlePhotoCapture}
              onCancel={() => setShowPhotoCapture(false)}
            />
          )}
          
          {capturedPhoto && (
            <div className="relative">
              <img
                src={capturedPhoto}
                alt="Captured leftover"
                className="w-full h-32 object-cover rounded-md"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCapturedPhoto(null)}
                className="absolute top-2 right-2 bg-white/80 hover:bg-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? 'Adding...' : 'Add Leftover'}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}