import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { userProfileService, userPreferencesService } from "../lib/database";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import {
	Settings as SettingsIcon,
	User,
	Heart,
	ChefHat,
	Utensils,
	Users,
	AlertTriangle,
	Globe,
	Save,
	Palette,
} from "lucide-react";
import type { UserProfile, UserPreferences } from "../types";

const DIETARY_RESTRICTIONS = [
	"Vegetarian",
	"Vegan",
	"Gluten-Free",
	"Dairy-Free",
	"Nut-Free",
	"Keto",
	"Low-Carb",
	"Paleo",
	"Halal",
	"Kosher",
];

const COMMON_ALLERGIES = [
	"Nuts",
	"Shellfish",
	"Eggs",
	"Dairy",
	"Soy",
	"Wheat",
	"Fish",
	"Sesame",
];

const CUISINE_TYPES = [
	"Italian",
	"Asian",
	"Mexican",
	"American",
	"Indian",
	"Thai",
	"Japanese",
	"Chinese",
	"French",
	"Greek",
	"Mediterranean",
	"British",
];

const KITCHEN_EQUIPMENT = [
	"Oven",
	"Microwave",
	"Stovetop",
	"Blender",
	"Food Processor",
	"Stand Mixer",
	"Air Fryer",
	"Slow Cooker",
	"Pressure Cooker",
	"Grill",
	"Toaster",
	"Rice Cooker",
];

const AVATAR_COLORS = [
	"#10B981", // Emerald
	"#3B82F6", // Blue
	"#8B5CF6", // Purple
	"#F59E0B", // Amber
	"#EF4444", // Red
	"#06B6D4", // Cyan
	"#84CC16", // Lime
	"#F97316", // Orange
];

export function Settings() {
	const { user } = useAuth();
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [preferences, setPreferences] = useState<UserPreferences | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [activeTab, setActiveTab] = useState("profile");

	// Form states
	const [profileForm, setProfileForm] = useState({
		full_name: "",
		bio: "",
		avatar_color: "#10B981",
	});

	const [preferencesForm, setPreferencesForm] = useState({
		dietary_restrictions: [] as string[],
		allergies: [] as string[],
		preferred_cuisines: [] as string[],
		cooking_skill_level: "Beginner" as const,
		measurement_units: "Metric" as const,
		family_size: 2,
		kitchen_equipment: [] as string[],
	});

	useEffect(() => {
		if (user) {
			loadUserData();
		}
	}, [user]);

	const loadUserData = async () => {
		if (!user) return;

		try {
			setLoading(true);
			const [profileData, preferencesData] = await Promise.all([
				userProfileService.getProfile(user.id),
				userPreferencesService.getPreferences(user.id),
			]);

			if (profileData) {
				setProfile(profileData);
				setProfileForm({
					full_name: profileData.full_name,
					bio: profileData.bio,
					avatar_color: profileData.avatar_color,
				});
			}

			if (preferencesData) {
				setPreferences(preferencesData);
				setPreferencesForm({
					dietary_restrictions: preferencesData.dietary_restrictions,
					allergies: preferencesData.allergies,
					preferred_cuisines: preferencesData.preferred_cuisines,
					cooking_skill_level: preferencesData.cooking_skill_level,
					measurement_units: preferencesData.measurement_units,
					family_size: preferencesData.family_size,
					kitchen_equipment: preferencesData.kitchen_equipment,
				});
			}
		} catch (error) {
			console.error("Error loading user data:", error);
		} finally {
			setLoading(false);
		}
	};

	const saveProfile = async () => {
		if (!user) return;

		try {
			setSaving(true);
			await userProfileService.updateProfile(user.id, profileForm);
			await loadUserData();
		} catch (error) {
			console.error("Error saving profile:", error);
		} finally {
			setSaving(false);
		}
	};

	const savePreferences = async () => {
		if (!user) return;

		try {
			setSaving(true);
			await userPreferencesService.updatePreferences(user.id, preferencesForm);
			await loadUserData();
		} catch (error) {
			console.error("Error saving preferences:", error);
		} finally {
			setSaving(false);
		}
	};

	const toggleArrayItem = (
		array: string[],
		item: string,
		setter: (value: string[]) => void
	) => {
		if (array.includes(item)) {
			setter(array.filter((i) => i !== item));
		} else {
			setter([...array, item]);
		}
	};

	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
			</div>
		);
	}

	const tabs = [
		{ id: "profile", label: "Profile", icon: User },
		{ id: "dietary", label: "Dietary", icon: Heart },
		{ id: "cooking", label: "Cooking", icon: ChefHat },
		{ id: "equipment", label: "Equipment", icon: Utensils },
	];

	return (
		<div className="space-y-4 sm:space-y-6">
			<div className="text-center sm:text-left">
				<h1 className="text-xl sm:text-2xl font-bold text-secondary-900">Settings</h1>
				<p className="text-sm sm:text-base text-secondary-600">
					Customize your cooking preferences and profile
				</p>
			</div>

			{/* Tabs */}
			<div className="flex flex-wrap gap-2">
				{tabs.map((tab) => (
					<button
						key={tab.id}
						onClick={() => setActiveTab(tab.id)}
						className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
							activeTab === tab.id
								? "bg-primary text-primary-foreground"
								: "bg-secondary text-secondary-foreground hover:bg-secondary/80"
						}`}
					>
						<tab.icon className="h-4 w-4" />
						<span>{tab.label}</span>
					</button>
				))}
			</div>

			{/* Profile Tab */}
			{activeTab === "profile" && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center space-x-2">
							<User className="h-5 w-5" />
							<span>Profile Information</span>
						</CardTitle>
						<CardDescription>
							Manage your personal information and avatar
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* Avatar Section */}
						<div className="flex items-center space-x-4">
							<div
								className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
								style={{ backgroundColor: profileForm.avatar_color }}
							>
								{getInitials(profileForm.full_name || user?.email || "U")}
							</div>
							<div className="flex-1">
								<h3 className="font-medium text-secondary-900">Avatar Color</h3>
								<p className="text-sm text-secondary-600 mb-2">
									Choose a color for your avatar
								</p>
								<div className="flex flex-wrap gap-2">
									{AVATAR_COLORS.map((color) => (
										<button
											key={color}
											onClick={() =>
												setProfileForm({ ...profileForm, avatar_color: color })
											}
											className={`w-8 h-8 rounded-full border-2 transition-all ${
												profileForm.avatar_color === color
													? "border-secondary-900 scale-110"
													: "border-secondary-300 hover:scale-105"
											}`}
											style={{ backgroundColor: color }}
										/>
									))}
								</div>
							</div>
						</div>

						<Separator />

						{/* Form Fields */}
						<div className="space-y-4">
							<Input
								label="Full Name"
								value={profileForm.full_name}
								onChange={(e) =>
									setProfileForm({ ...profileForm, full_name: e.target.value })
								}
								placeholder="Enter your full name"
							/>

							<div>
								<label className="block text-sm font-medium text-secondary-700 mb-1">
									Bio (Optional)
								</label>
								<textarea
									value={profileForm.bio}
									onChange={(e) =>
										setProfileForm({ ...profileForm, bio: e.target.value })
									}
									placeholder="Tell us about your cooking journey..."
									className="w-full h-20 rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none"
								/>
							</div>

							<Button onClick={saveProfile} disabled={saving} className="w-full sm:w-auto">
								<Save className="h-4 w-4 mr-2" />
								{saving ? "Saving..." : "Save Profile"}
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Dietary Tab */}
			{activeTab === "dietary" && (
				<div className="space-y-6">
					{/* Dietary Restrictions */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center space-x-2">
								<Heart className="h-5 w-5" />
								<span>Dietary Restrictions</span>
							</CardTitle>
							<CardDescription>
								Select any dietary restrictions you follow
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex flex-wrap gap-2">
								{DIETARY_RESTRICTIONS.map((restriction) => (
									<button
										key={restriction}
										onClick={() =>
											toggleArrayItem(
												preferencesForm.dietary_restrictions,
												restriction,
												(newRestrictions) =>
													setPreferencesForm({
														...preferencesForm,
														dietary_restrictions: newRestrictions,
													})
											)
										}
										className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
											preferencesForm.dietary_restrictions.includes(restriction)
												? "bg-primary text-primary-foreground"
												: "bg-secondary text-secondary-foreground hover:bg-secondary/80"
										}`}
									>
										{restriction}
									</button>
								))}
							</div>
						</CardContent>
					</Card>

					{/* Allergies */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center space-x-2">
								<AlertTriangle className="h-5 w-5" />
								<span>Allergies</span>
							</CardTitle>
							<CardDescription>
								Select any food allergies you have
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex flex-wrap gap-2">
								{COMMON_ALLERGIES.map((allergy) => (
									<button
										key={allergy}
										onClick={() =>
											toggleArrayItem(
												preferencesForm.allergies,
												allergy,
												(newAllergies) =>
													setPreferencesForm({
														...preferencesForm,
														allergies: newAllergies,
													})
											)
										}
										className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
											preferencesForm.allergies.includes(allergy)
												? "bg-red-500 text-white"
												: "bg-secondary text-secondary-foreground hover:bg-secondary/80"
										}`}
									>
										{allergy}
									</button>
								))}
							</div>
						</CardContent>
					</Card>

					{/* Preferred Cuisines */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center space-x-2">
								<Globe className="h-5 w-5" />
								<span>Preferred Cuisines</span>
							</CardTitle>
							<CardDescription>
								Select the types of cuisine you enjoy
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex flex-wrap gap-2">
								{CUISINE_TYPES.map((cuisine) => (
									<button
										key={cuisine}
										onClick={() =>
											toggleArrayItem(
												preferencesForm.preferred_cuisines,
												cuisine,
												(newCuisines) =>
													setPreferencesForm({
														...preferencesForm,
														preferred_cuisines: newCuisines,
													})
											)
										}
										className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
											preferencesForm.preferred_cuisines.includes(cuisine)
												? "bg-primary text-primary-foreground"
												: "bg-secondary text-secondary-foreground hover:bg-secondary/80"
										}`}
									>
										{cuisine}
									</button>
								))}
							</div>
						</CardContent>
					</Card>

					<Button onClick={savePreferences} disabled={saving} className="w-full sm:w-auto">
						<Save className="h-4 w-4 mr-2" />
						{saving ? "Saving..." : "Save Dietary Preferences"}
					</Button>
				</div>
			)}

			{/* Cooking Tab */}
			{activeTab === "cooking" && (
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center space-x-2">
								<ChefHat className="h-5 w-5" />
								<span>Cooking Preferences</span>
							</CardTitle>
							<CardDescription>
								Tell us about your cooking experience and preferences
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							{/* Cooking Skill Level */}
							<div>
								<label className="block text-sm font-medium text-secondary-700 mb-2">
									Cooking Skill Level
								</label>
								<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
									{["Beginner", "Intermediate", "Advanced", "Expert"].map((level) => (
										<button
											key={level}
											onClick={() =>
												setPreferencesForm({
													...preferencesForm,
													cooking_skill_level: level as any,
												})
											}
											className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
												preferencesForm.cooking_skill_level === level
													? "bg-primary text-primary-foreground"
													: "bg-secondary text-secondary-foreground hover:bg-secondary/80"
											}`}
										>
											{level}
										</button>
									))}
								</div>
							</div>

							<Separator />

							{/* Measurement Units */}
							<div>
								<label className="block text-sm font-medium text-secondary-700 mb-2">
									Preferred Measurement Units
								</label>
								<div className="flex gap-2">
									{["Metric", "Imperial"].map((unit) => (
										<button
											key={unit}
											onClick={() =>
												setPreferencesForm({
													...preferencesForm,
													measurement_units: unit as any,
												})
											}
											className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
												preferencesForm.measurement_units === unit
													? "bg-primary text-primary-foreground"
													: "bg-secondary text-secondary-foreground hover:bg-secondary/80"
											}`}
										>
											{unit}
										</button>
									))}
								</div>
								<p className="text-xs text-secondary-600 mt-1">
									{preferencesForm.measurement_units === "Metric"
										? "Grams, kilograms, milliliters, liters, Celsius"
										: "Ounces, pounds, cups, tablespoons, Fahrenheit"}
								</p>
							</div>

							<Separator />

							{/* Family Size */}
							<div>
								<label className="block text-sm font-medium text-secondary-700 mb-2">
									Family Size
								</label>
								<div className="flex items-center space-x-2">
									<Users className="h-4 w-4 text-secondary-600" />
									<input
										type="number"
										min="1"
										max="20"
										value={preferencesForm.family_size}
										onChange={(e) =>
											setPreferencesForm({
												...preferencesForm,
												family_size: parseInt(e.target.value) || 1,
											})
										}
										className="w-20 rounded-lg border border-secondary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
									/>
									<span className="text-sm text-secondary-600">
										people (affects recipe serving suggestions)
									</span>
								</div>
							</div>
						</CardContent>
					</Card>

					<Button onClick={savePreferences} disabled={saving} className="w-full sm:w-auto">
						<Save className="h-4 w-4 mr-2" />
						{saving ? "Saving..." : "Save Cooking Preferences"}
					</Button>
				</div>
			)}

			{/* Equipment Tab */}
			{activeTab === "equipment" && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center space-x-2">
							<Utensils className="h-5 w-5" />
							<span>Kitchen Equipment</span>
						</CardTitle>
						<CardDescription>
							Select the kitchen equipment you have available (this helps us suggest appropriate recipes)
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex flex-wrap gap-2">
							{KITCHEN_EQUIPMENT.map((equipment) => (
								<button
									key={equipment}
									onClick={() =>
										toggleArrayItem(
											preferencesForm.kitchen_equipment,
											equipment,
											(newEquipment) =>
												setPreferencesForm({
													...preferencesForm,
													kitchen_equipment: newEquipment,
												})
										)
									}
									className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
										preferencesForm.kitchen_equipment.includes(equipment)
											? "bg-primary text-primary-foreground"
											: "bg-secondary text-secondary-foreground hover:bg-secondary/80"
									}`}
								>
									{equipment}
								</button>
							))}
						</div>

						<div className="mt-6">
							<Button onClick={savePreferences} disabled={saving} className="w-full sm:w-auto">
								<Save className="h-4 w-4 mr-2" />
								{saving ? "Saving..." : "Save Equipment"}
							</Button>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}