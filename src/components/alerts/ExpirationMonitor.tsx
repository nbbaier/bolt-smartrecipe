// biome-ignore-all assist/source/organizeImports: needed for testing
// @ts-nocheck
import React from "react";
import { AlertTriangle, Calendar, Clock, Settings } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Ingredient } from "../../types";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";

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
  warning: Ingredient[]; // 4-7 days
  upcoming: Ingredient[]; // 8-14 days
}

export function ExpirationMonitor({
  ingredients,
  onUpdateSettings,
  className,
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

  const categorizeByExpiration = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newGroups: ExpirationGroup = {
      expired: [],
      critical: [],
      warning: [],
      upcoming: [],
    };

    ingredients
      .filter((ingredient) => ingredient.expiration_date)
      .forEach((ingredient) => {
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
    Object.values(newGroups).forEach((group) => {
      group.sort(
        (a: Ingredient, b: Ingredient) =>
          new Date(a.expiration_date!).getTime() -
          new Date(b.expiration_date!).getTime(),
      );
    });

    setGroups(newGroups);
  }, [ingredients, settings]);

  useEffect(() => {
    categorizeByExpiration();
  }, [categorizeByExpiration]);

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
      return `Expired ${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""} ago`;
    } else if (days === 0) {
      return "Expires today";
    } else if (days === 1) {
      return "Expires tomorrow";
    } else {
      return `Expires in ${days} days`;
    }
  };

  const totalExpiringItems =
    groups.expired.length + groups.critical.length + groups.warning.length;

  if (totalExpiringItems === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-4 text-center">
          <Calendar className="mx-auto mb-2 w-8 h-8 text-green-500" />
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
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <CardTitle className="text-lg">Expiration Monitor</CardTitle>
            <Badge
              variant="outline"
              className="text-orange-800 bg-orange-100 border-orange-300"
            >
              {totalExpiringItems} item
              {totalExpiringItems !== 1 ? "s" : ""}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Settings Panel */}
        {showSettings && (
          <div className="p-3 space-y-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900">
              Alert Settings
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="warning-days"
                  className="block mb-1 text-xs font-medium text-gray-700"
                >
                  Warning (days)
                </label>
                <input
                  id="warning-days"
                  type="number"
                  min="1"
                  max="30"
                  value={settings.warningDays}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      warningDays: parseInt(e.target.value) || 7,
                    }))
                  }
                  className="px-2 py-1 w-full text-sm rounded-md border border-gray-300"
                />
              </div>
              <div>
                <label
                  htmlFor="critical-days"
                  className="block mb-1 text-xs font-medium text-gray-700"
                >
                  Critical (days)
                </label>
                <input
                  id="critical-days"
                  type="number"
                  min="1"
                  max="7"
                  value={settings.criticalDays}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      criticalDays: parseInt(e.target.value) || 3,
                    }))
                  }
                  className="px-2 py-1 w-full text-sm rounded-md border border-gray-300"
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
            <h4 className="flex items-center mb-2 text-sm font-medium text-red-900">
              <AlertTriangle className="mr-1 w-4 h-4" />
              Expired ({groups.expired.length})
            </h4>
            <div className="space-y-2">
              {groups.expired.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center p-2 bg-red-50 rounded-lg border border-red-200"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-red-900 truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-red-700">
                      {item.quantity} {item.unit} • {item.category}
                    </p>
                  </div>
                  <div className="flex-shrink-0 ml-2 text-right">
                    <span className="text-xs font-medium text-red-600">
                      {formatExpirationText(
                        getDaysUntilExpiration(item.expiration_date!),
                      )}
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
            <h4 className="flex items-center mb-2 text-sm font-medium text-red-800">
              <Clock className="mr-1 w-4 h-4" />
              Critical ({groups.critical.length})
            </h4>
            <div className="space-y-2">
              {groups.critical.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center p-2 bg-red-50 rounded-lg border border-red-200"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-red-900 truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-red-700">
                      {item.quantity} {item.unit} • {item.category}
                    </p>
                  </div>
                  <div className="flex-shrink-0 ml-2 text-right">
                    <span className="text-xs font-medium text-red-600">
                      {formatExpirationText(
                        getDaysUntilExpiration(item.expiration_date!),
                      )}
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
            <h4 className="flex items-center mb-2 text-sm font-medium text-orange-800">
              <AlertTriangle className="mr-1 w-4 h-4" />
              Warning ({groups.warning.length})
            </h4>
            <div className="space-y-2">
              {groups.warning.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center p-2 bg-orange-50 rounded-lg border border-orange-200"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-orange-900 truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-orange-700">
                      {item.quantity} {item.unit} • {item.category}
                    </p>
                  </div>
                  <div className="flex-shrink-0 ml-2 text-right">
                    <span className="text-xs font-medium text-orange-600">
                      {formatExpirationText(
                        getDaysUntilExpiration(item.expiration_date!),
                      )}
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
            <summary className="flex items-center text-sm font-medium text-blue-800 cursor-pointer">
              <Calendar className="mr-1 w-4 h-4" />
              Upcoming ({groups.upcoming.length})
              <span className="ml-auto text-xs text-blue-600 group-open:hidden">
                Click to expand
              </span>
            </summary>
            <div className="mt-2 space-y-2">
              {groups.upcoming.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center p-2 bg-blue-50 rounded-lg border border-blue-200"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-blue-900 truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-blue-700">
                      {item.quantity} {item.unit} • {item.category}
                    </p>
                  </div>
                  <div className="flex-shrink-0 ml-2 text-right">
                    <span className="text-xs font-medium text-blue-600">
                      {formatExpirationText(
                        getDaysUntilExpiration(item.expiration_date!),
                      )}
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
