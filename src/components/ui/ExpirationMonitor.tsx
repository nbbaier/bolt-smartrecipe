import React, { useState, useEffect } from "react";
import { Calendar, AlertTriangle, Clock, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./Card";
import { Button } from "./Button";
import { Badge } from "./badge";
import type { Ingredient } from "../../types";

interface ExpirationMonitorProps {
  ingredients: Ingredient[];
  onUpdateSettings?: (settings: ExpirationSettings) => void;
  className?: string;
}

interface ExpirationSettings {
  warningDays: number;
  criticalDays: number;
  enableNotifications: boolean;
}

interface ExpirationGroup {
  expired: Ingredient[];
  critical: Ingredient[]; // 1-3 days
  warning: Ingredient[];  // 4-7 days
  upcoming: Ingredient[]; // 8-14 days
}

export function ExpirationMonitor({ 
  ingredients, 
  onUpdateSettings,
  className 
}: ExpirationMonitorProps) {
  const [settings, setSettings] = useState<ExpirationSettings>({
    warningDays: 7,
    criticalDays: 3,
    enableNotifications: true,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [groups, setGroups] = useState<ExpirationGroup>({
    expired: [],
    critical: [],
    warning: [],
    upcoming: [],
  });

  useEffect(() => {
    categorizeByExpiration();
  }, [ingredients, settings]);

  const categorizeByExpiration = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newGroups: ExpirationGroup = {
      expired: [],
      critical: [],
      warning: [],
      upcoming: [],
    };

    ingredients
      .filter(ingredient => ingredient.expiration_date)
      .forEach(ingredient => {
        const expDate = new Date(ingredient.expiration_date!);
        expDate.setHours(0, 0, 0, 0);
        
        const diffTime = expDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          newGroups.expired.push(ingredient);
        } else if (diffDays <= settings.criticalDays) {
          newGroups.critical.push(ingredient);
        } else if (diffDays <= settings.warningDays) {
          newGroups.warning.push(ingredient);
        } else if (diffDays <= 14) {
          newGroups.upcoming.push(ingredient);
        }
      });

    // Sort each group by expiration date
    Object.values(newGroups).forEach(group => {
      group.sort((a, b) => 
        new Date(a.expiration_date!).getTime() - new Date(b.expiration_date!).getTime()
      );
    });

    setGroups(newGroups);
  };

  const getDaysUntilExpiration = (expirationDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(expirationDate);
    expDate.setHours(0, 0, 0, 0);
    
    const diffTime = expDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatExpirationText = (days: number) => {
    if (days < 0) {
      return `Expired ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} ago`;
    } else if (days === 0) {
      return "Expires today";
    } else if (days === 1) {
      return "Expires tomorrow";
    } else {
      return `Expires in ${days} days`;
    }
  };

  const getExpirationColor = (days: number) => {
    if (days < 0) return "text-red-600 bg-red-50 border-red-200";
    if (days <= settings.criticalDays) return "text-red-600 bg-red-50 border-red-200";
    if (days <= settings.warningDays) return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-blue-600 bg-blue-50 border-blue-200";
  };

  const totalExpiringItems = groups.expired.length + groups.critical.length + groups.warning.length;

  if (totalExpiringItems === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-4 text-center">
          <Calendar className="h-8 w-8 text-green-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            No items expiring soon. Your pantry is well managed!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-lg">Expiration Monitor</CardTitle>
            <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
              {totalExpiringItems} item{totalExpiringItems !== 1 ? 's' : ''}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-gray-50 rounded-lg p-3 space-y-3">
            <h4 className="text-sm font-medium text-gray-900">Alert Settings</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Warning (days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={settings.warningDays}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    warningDays: parseInt(e.target.value) || 7
                  }))}
                  className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Critical (days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={settings.criticalDays}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    criticalDays: parseInt(e.target.value) || 3
                  }))}
                  className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
                />
              </div>
            </div>
            {onUpdateSettings && (
              <Button
                size="sm"
                onClick={() => onUpdateSettings(settings)}
                className="w-full"
              >
                Save Settings
              </Button>
            )}
          </div>
        )}

        {/* Expired Items */}
        {groups.expired.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-red-900 mb-2 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Expired ({groups.expired.length})
            </h4>
            <div className="space-y-2">
              {groups.expired.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-red-900 truncate">{item.name}</p>
                    <p className="text-xs text-red-700">
                      {item.quantity} {item.unit} • {item.category}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <span className="text-xs font-medium text-red-600">
                      {formatExpirationText(getDaysUntilExpiration(item.expiration_date!))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Critical Items */}
        {groups.critical.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-red-800 mb-2 flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              Critical ({groups.critical.length})
            </h4>
            <div className="space-y-2">
              {groups.critical.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-red-900 truncate">{item.name}</p>
                    <p className="text-xs text-red-700">
                      {item.quantity} {item.unit} • {item.category}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <span className="text-xs font-medium text-red-600">
                      {formatExpirationText(getDaysUntilExpiration(item.expiration_date!))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warning Items */}
        {groups.warning.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-orange-800 mb-2 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Warning ({groups.warning.length})
            </h4>
            <div className="space-y-2">
              {groups.warning.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 bg-orange-50 border border-orange-200 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-orange-900 truncate">{item.name}</p>
                    <p className="text-xs text-orange-700">
                      {item.quantity} {item.unit} • {item.category}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <span className="text-xs font-medium text-orange-600">
                      {formatExpirationText(getDaysUntilExpiration(item.expiration_date!))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Items (collapsed by default) */}
        {groups.upcoming.length > 0 && (
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-blue-800 flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Upcoming ({groups.upcoming.length})
              <span className="ml-auto text-xs text-blue-600 group-open:hidden">
                Click to expand
              </span>
            </summary>
            <div className="mt-2 space-y-2">
              {groups.upcoming.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-blue-900 truncate">{item.name}</p>
                    <p className="text-xs text-blue-700">
                      {item.quantity} {item.unit} • {item.category}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <span className="text-xs font-medium text-blue-600">
                      {formatExpirationText(getDaysUntilExpiration(item.expiration_date!))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
}