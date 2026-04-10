import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { UserRole } from "@/types";

interface RoleSelectorProps {
  selectedRole: UserRole;
  onSelect: (role: UserRole) => void;
  showAdmin?: boolean;
}

const ROLES: { role: UserRole; label: string; icon: keyof typeof Feather.glyphMap; desc: string }[] = [
  { role: "CUSTOMER", label: "Customer", icon: "shopping-bag", desc: "Place laundry orders" },
  { role: "BUSINESS", label: "Business", icon: "briefcase", desc: "Manage your laundromat" },
  { role: "DISPATCHER", label: "Dispatcher", icon: "truck", desc: "Handle deliveries" },
];

export function RoleSelector({ selectedRole, onSelect, showAdmin }: RoleSelectorProps) {
  const colors = useColors();

  const roles = showAdmin
    ? [...ROLES, { role: "ADMIN" as UserRole, label: "Admin", icon: "shield" as keyof typeof Feather.glyphMap, desc: "Platform management" }]
    : ROLES;

  return (
    <View style={styles.container}>
      {roles.map((item) => {
        const isSelected = selectedRole === item.role;
        return (
          <Pressable
            key={item.role}
            onPress={() => onSelect(item.role)}
            style={[
              styles.roleCard,
              {
                backgroundColor: isSelected ? colors.primary : colors.card,
                borderColor: isSelected ? colors.primary : colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <Feather
              name={item.icon}
              size={22}
              color={isSelected ? colors.primaryForeground : colors.primary}
            />
            <View style={styles.roleText}>
              <Text
                style={[
                  styles.roleLabel,
                  { color: isSelected ? colors.primaryForeground : colors.foreground },
                ]}
              >
                {item.label}
              </Text>
              <Text
                style={[
                  styles.roleDesc,
                  { color: isSelected ? colors.primaryForeground : colors.mutedForeground },
                ]}
                numberOfLines={1}
              >
                {item.desc}
              </Text>
            </View>
            {isSelected && (
              <Feather name="check-circle" size={18} color={colors.primaryForeground} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  roleText: {
    flex: 1,
  },
  roleLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  roleDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
});
