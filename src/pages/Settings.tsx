import { zodResolver } from "@hookform/resolvers/zod";
import {
   AlertTriangle,
   ChefHat,
   Globe,
   Heart,
   Save,
   User,
   Users,
   Utensils,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "../components/ui/Button";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Separator } from "../components/ui/separator";
import { useAuth } from "../contexts/AuthContext";
import { userPreferencesService, userProfileService } from "../lib/database";
import { supabase } from "../lib/supabase";
import type { UserPreferences, UserProfile } from "../types";

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

type CookingSkillLevel = "Beginner" | "Intermediate" | "Advanced" | "Expert";
type MeasurementUnits = "Metric" | "Imperial";

// Zod schemas
const profileSchema = z.object({
   full_name: z.string().min(2, "Full name is required"),
   bio: z.string().max(300, "Bio must be 300 characters or less").optional(),
   avatar_color: z.string().min(1),
});

const preferencesSchema = z.object({
   dietary_restrictions: z.array(z.string()),
   allergies: z.array(z.string()),
   preferred_cuisines: z.array(z.string()),
   cooking_skill_level: z.enum([
      "Beginner",
      "Intermediate",
      "Advanced",
      "Expert",
   ]),
   measurement_units: z.enum(["Metric", "Imperial"]),
   family_size: z.number().min(1, "Family size must be at least 1"),
   kitchen_equipment: z.array(z.string()),
});

export function Settings() {
   const { user } = useAuth();
   const [_profile, setProfile] = useState<UserProfile | null>(null);
   const [_preferences, setPreferences] = useState<UserPreferences | null>(
      null,
   );
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
   const [activeTab, setActiveTab] = useState("profile");
   const [uploading, setUploading] = useState(false);
   const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

   // Form states
   const [profileForm, setProfileForm] = useState({
      full_name: "",
      bio: "",
      avatar_color: "#10B981",
   });

   const [preferencesForm, setPreferencesForm] = useState<{
      dietary_restrictions: string[];
      allergies: string[];
      preferred_cuisines: string[];
      cooking_skill_level: CookingSkillLevel;
      measurement_units: MeasurementUnits;
      family_size: number;
      kitchen_equipment: string[];
   }>({
      dietary_restrictions: [],
      allergies: [],
      preferred_cuisines: [],
      cooking_skill_level: "Beginner",
      measurement_units: "Metric",
      family_size: 2,
      kitchen_equipment: [],
   });

   // Replace local state with useForm for profile
   const {
      register: registerProfile,
      handleSubmit: handleProfileSubmit,
      setValue: _setProfileValue,
      formState: { errors: profileErrors },
      control: profileControl,
   } = useForm({
      resolver: zodResolver(profileSchema),
      defaultValues: profileForm,
   });

   // Replace local state with useForm for preferences
   const {
      handleSubmit: handlePreferencesSubmit,
      setValue: setPreferencesValue,
      formState: { errors: preferencesErrors },
      control: preferencesControl,
   } = useForm({
      resolver: zodResolver(preferencesSchema),
      defaultValues: preferencesForm,
   });

   const loadUserData = useCallback(async () => {
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
   }, [user]);

   useEffect(() => {
      if (user) {
         loadUserData();
      }
   }, [user, loadUserData]);

   useEffect(() => {
      if (_profile?.avatar_url) {
         setAvatarUrl(_profile.avatar_url);
      }
   }, [_profile]);

   const saveProfile = async () => {
      if (!user) return;
      try {
         setSaving(true);
         await userProfileService.updateProfile(user.id, profileForm);
         await loadUserData();
         toast.success("Profile saved successfully!");
      } catch (error) {
         toast.error("Failed to save profile. Please try again.");
         console.error("Error saving profile:", error);
      } finally {
         setSaving(false);
      }
   };

   const savePreferences = async () => {
      if (!user) return;
      try {
         setSaving(true);
         await userPreferencesService.updatePreferences(
            user.id,
            preferencesForm,
         );
         await loadUserData();
         toast.success("Preferences saved successfully!");
      } catch (error) {
         toast.error("Failed to save preferences. Please try again.");
         console.error("Error saving preferences:", error);
      } finally {
         setSaving(false);
      }
   };

   const toggleArrayItem = (
      array: string[],
      item: string,
      setter: (value: string[]) => void,
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

   const handleAvatarUpload = async (
      e: React.ChangeEvent<HTMLInputElement>,
   ) => {
      if (!user || !e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      setUploading(true);
      try {
         const fileExt = file.name.split(".").pop();
         const filePath = `${user.id}.${fileExt}`;
         const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(filePath, file, { upsert: true });
         if (uploadError) throw uploadError;
         const { data } = supabase.storage
            .from("avatars")
            .getPublicUrl(filePath);
         const publicUrl = data.publicUrl;
         setAvatarUrl(publicUrl);
         await userProfileService.updateProfile(user.id, {
            avatar_url: publicUrl,
         });
         await loadUserData();
      } catch (_error) {
         alert("Failed to upload avatar image");
      } finally {
         setUploading(false);
      }
   };

   // Profile completion calculation
   function getProfileCompletion(
      profile: UserProfile | null,
      preferences: UserPreferences | null,
   ) {
      if (!profile || !preferences) return 0;
      let filled = 0;
      const total = 8;
      if (profile.full_name && profile.full_name.trim().length > 1) filled++;
      if (profile.bio && profile.bio.trim().length > 0) filled++;
      if (profile.avatar_color || profile.avatar_url) filled++;
      if (
         preferences.dietary_restrictions &&
         preferences.dietary_restrictions.length > 0
      )
         filled++;
      if (preferences.allergies && preferences.allergies.length > 0) filled++;
      if (preferences.cooking_skill_level) filled++;
      if (preferences.measurement_units) filled++;
      if (
         preferences.kitchen_equipment &&
         preferences.kitchen_equipment.length > 0
      )
         filled++;
      return Math.round((filled / total) * 100);
   }

   const completion = getProfileCompletion(_profile, _preferences);

   if (loading) {
      return (
         <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 rounded-full border-b-2 animate-spin border-primary"></div>
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
         {/* Profile Completion Bar */}
         <div className="flex items-center mb-2 space-x-4">
            <div className="flex-1">
               <div className="mb-1 text-xs font-medium text-secondary-700">
                  Profile {completion}% complete
               </div>
               <div className="overflow-hidden w-full h-2 rounded-full bg-secondary-200">
                  <div
                     className="h-2 rounded-full transition-all bg-primary"
                     style={{ width: `${completion}%` }}
                  />
               </div>
            </div>
            {completion === 100 && (
               <span className="ml-2 text-xs font-bold text-green-600">✓</span>
            )}
         </div>

         <div className="text-center sm:text-left">
            <h1 className="text-xl font-bold sm:text-2xl text-secondary-900">
               Settings
            </h1>
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
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
               </button>
            ))}
         </div>

         {/* Profile Tab */}
         {activeTab === "profile" && (
            <Card>
               <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                     <User className="w-5 h-5" />
                     <span>Profile Information</span>
                  </CardTitle>
                  <CardDescription>
                     Manage your personal information and avatar
                  </CardDescription>
               </CardHeader>
               <CardContent className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex items-center space-x-4">
                     {avatarUrl ? (
                        <img
                           src={avatarUrl}
                           alt="Profile avatar"
                           className="object-cover w-16 h-16 rounded-full border"
                        />
                     ) : (
                        <div
                           className="flex justify-center items-center w-16 h-16 text-xl font-bold text-white rounded-full"
                           style={{
                              backgroundColor:
                                 profileControl._formValues.avatar_color,
                           }}
                        >
                           {getInitials(
                              profileControl._formValues.full_name ||
                                 user?.email ||
                                 "U",
                           )}
                        </div>
                     )}
                     <div className="flex-1">
                        <h3 className="font-medium text-secondary-900">
                           Profile Image
                        </h3>
                        <p className="mb-2 text-sm text-secondary-600">
                           Upload a profile photo (optional)
                        </p>
                        <input
                           type="file"
                           accept="image/*"
                           onChange={handleAvatarUpload}
                           disabled={uploading}
                           className="block w-full text-sm text-secondary-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                        />
                        {uploading && (
                           <p className="mt-1 text-xs text-secondary-500">
                              Uploading...
                           </p>
                        )}
                     </div>
                  </div>

                  <Separator />

                  {/* Form Fields */}
                  <form
                     onSubmit={handleProfileSubmit(saveProfile)}
                     className="space-y-4"
                  >
                     <Input
                        label="Full Name"
                        {...registerProfile("full_name")}
                        error={profileErrors.full_name?.message}
                        placeholder="Enter your full name"
                     />

                     <div>
                        <label className="block mb-1 text-sm font-medium text-secondary-700">
                           Bio (Optional)
                        </label>
                        <textarea
                           {...registerProfile("bio")}
                           placeholder="Tell us about your cooking journey..."
                           className="px-3 py-2 w-full h-20 text-sm rounded-lg border resize-none border-secondary-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        />
                        {profileErrors.bio && (
                           <p className="mt-1 text-xs text-red-600">
                              {profileErrors.bio.message}
                           </p>
                        )}
                     </div>

                     <Button
                        type="submit"
                        disabled={saving}
                        className="w-full sm:w-auto"
                     >
                        <Save className="mr-2 w-4 h-4" />
                        {saving ? "Saving..." : "Save Profile"}
                     </Button>
                  </form>
               </CardContent>
            </Card>
         )}

         {/* Dietary Tab */}
         {activeTab === "dietary" && (
            <form
               onSubmit={handlePreferencesSubmit(savePreferences)}
               className="space-y-6"
            >
               {/* Dietary Restrictions */}
               <Card>
                  <CardHeader>
                     <CardTitle className="flex items-center space-x-2">
                        <Heart className="w-5 h-5" />
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
                              type="button"
                              onClick={() => {
                                 const current =
                                    preferencesControl._formValues
                                       .dietary_restrictions;
                                 setPreferencesValue(
                                    "dietary_restrictions",
                                    current.includes(restriction)
                                       ? current.filter(
                                            (r: string) => r !== restriction,
                                         )
                                       : [...current, restriction],
                                 );
                              }}
                              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                 preferencesControl._formValues.dietary_restrictions.includes(
                                    restriction,
                                 )
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                              }`}
                           >
                              {restriction}
                           </button>
                        ))}
                     </div>
                     {preferencesErrors.dietary_restrictions && (
                        <p className="mt-1 text-xs text-red-600">
                           {preferencesErrors.dietary_restrictions.message}
                        </p>
                     )}
                  </CardContent>
               </Card>

               {/* Allergies */}
               <Card>
                  <CardHeader>
                     <CardTitle className="flex items-center space-x-2">
                        <AlertTriangle className="w-5 h-5" />
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
                              type="button"
                              onClick={() => {
                                 const current =
                                    preferencesControl._formValues.allergies;
                                 setPreferencesValue(
                                    "allergies",
                                    current.includes(allergy)
                                       ? current.filter(
                                            (a: string) => a !== allergy,
                                         )
                                       : [...current, allergy],
                                 );
                              }}
                              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                 preferencesControl._formValues.allergies.includes(
                                    allergy,
                                 )
                                    ? "bg-red-500 text-white"
                                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                              }`}
                           >
                              {allergy}
                           </button>
                        ))}
                     </div>
                     {preferencesErrors.allergies && (
                        <p className="mt-1 text-xs text-red-600">
                           {preferencesErrors.allergies.message}
                        </p>
                     )}
                  </CardContent>
               </Card>

               {/* Preferred Cuisines */}
               <Card>
                  <CardHeader>
                     <CardTitle className="flex items-center space-x-2">
                        <Globe className="w-5 h-5" />
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
                              type="button"
                              onClick={() => {
                                 const current =
                                    preferencesControl._formValues
                                       .preferred_cuisines;
                                 setPreferencesValue(
                                    "preferred_cuisines",
                                    current.includes(cuisine)
                                       ? current.filter(
                                            (c: string) => c !== cuisine,
                                         )
                                       : [...current, cuisine],
                                 );
                              }}
                              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                 preferencesControl._formValues.preferred_cuisines.includes(
                                    cuisine,
                                 )
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                              }`}
                           >
                              {cuisine}
                           </button>
                        ))}
                     </div>
                     {preferencesErrors.preferred_cuisines && (
                        <p className="mt-1 text-xs text-red-600">
                           {preferencesErrors.preferred_cuisines.message}
                        </p>
                     )}
                  </CardContent>
               </Card>

               <Button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto"
               >
                  <Save className="mr-2 w-4 h-4" />
                  {saving ? "Saving..." : "Save Dietary Preferences"}
               </Button>
            </form>
         )}

         {/* Cooking Tab */}
         {activeTab === "cooking" && (
            <div className="space-y-6">
               <Card>
                  <CardHeader>
                     <CardTitle className="flex items-center space-x-2">
                        <ChefHat className="w-5 h-5" />
                        <span>Cooking Preferences</span>
                     </CardTitle>
                     <CardDescription>
                        Tell us about your cooking experience and preferences
                     </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                     {/* Cooking Skill Level */}
                     <div>
                        <label className="block mb-2 text-sm font-medium text-secondary-700">
                           Cooking Skill Level
                        </label>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                           {[
                              "Beginner",
                              "Intermediate",
                              "Advanced",
                              "Expert",
                           ].map((level) => (
                              <button
                                 key={level}
                                 onClick={() =>
                                    setPreferencesForm({
                                       ...preferencesForm,
                                       cooking_skill_level:
                                          level as CookingSkillLevel,
                                    })
                                 }
                                 className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    preferencesForm.cooking_skill_level ===
                                    level
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
                        <label className="block mb-2 text-sm font-medium text-secondary-700">
                           Preferred Measurement Units
                        </label>
                        <div className="flex gap-2">
                           {["Metric", "Imperial"].map((unit) => (
                              <button
                                 key={unit}
                                 onClick={() =>
                                    setPreferencesForm({
                                       ...preferencesForm,
                                       measurement_units:
                                          unit as MeasurementUnits,
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
                        <p className="mt-1 text-xs text-secondary-600">
                           {preferencesForm.measurement_units === "Metric"
                              ? "Grams, kilograms, milliliters, liters, Celsius"
                              : "Ounces, pounds, cups, tablespoons, Fahrenheit"}
                        </p>
                     </div>

                     <Separator />

                     {/* Family Size */}
                     <div>
                        <label className="block mb-2 text-sm font-medium text-secondary-700">
                           Family Size
                        </label>
                        <div className="flex items-center space-x-2">
                           <Users className="w-4 h-4 text-secondary-600" />
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
                              className="px-3 py-2 w-20 text-sm rounded-lg border border-secondary-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                           />
                           <span className="text-sm text-secondary-600">
                              people (affects recipe serving suggestions)
                           </span>
                        </div>
                     </div>
                  </CardContent>
               </Card>

               <Button
                  onClick={savePreferences}
                  disabled={saving}
                  className="w-full sm:w-auto"
               >
                  <Save className="mr-2 w-4 h-4" />
                  {saving ? "Saving..." : "Save Cooking Preferences"}
               </Button>
            </div>
         )}

         {/* Equipment Tab */}
         {activeTab === "equipment" && (
            <Card>
               <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                     <Utensils className="w-5 h-5" />
                     <span>Kitchen Equipment</span>
                  </CardTitle>
                  <CardDescription>
                     Select the kitchen equipment you have available (this helps
                     us suggest appropriate recipes)
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
                                    }),
                              )
                           }
                           className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              preferencesForm.kitchen_equipment.includes(
                                 equipment,
                              )
                                 ? "bg-primary text-primary-foreground"
                                 : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                           }`}
                        >
                           {equipment}
                        </button>
                     ))}
                  </div>

                  <div className="mt-6">
                     <Button
                        onClick={savePreferences}
                        disabled={saving}
                        className="w-full sm:w-auto"
                     >
                        <Save className="mr-2 w-4 h-4" />
                        {saving ? "Saving..." : "Save Equipment"}
                     </Button>
                  </div>
               </CardContent>
            </Card>
         )}
      </div>
   );
}
