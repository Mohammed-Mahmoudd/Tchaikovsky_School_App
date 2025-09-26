import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SystemSettingsScreenProps {
  onBack: () => void;
}

export function SystemSettingsScreen({ onBack }: SystemSettingsScreenProps) {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    autoBackup: true,
    maintenanceMode: false,
    allowGuestAccess: false,
    requirePasswordReset: false,
  });

  const toggleSetting = (key: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'This will export all system data to a CSV file. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export', onPress: () => Alert.alert('Success', 'Data exported successfully') },
      ]
    );
  };

  const handleBackupDatabase = () => {
    Alert.alert(
      'Backup Database',
      'This will create a full backup of the database. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Backup', onPress: () => Alert.alert('Success', 'Database backup created') },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. The app may be slower until cache rebuilds.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', onPress: () => Alert.alert('Success', 'Cache cleared successfully') },
      ]
    );
  };

  const renderSettingItem = (
    title: string,
    description: string,
    settingKey: string,
    icon: string
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon as any} size={24} color="#FFFFFF" />
      </View>
      
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      
      <Switch
        value={settings[settingKey as keyof typeof settings]}
        onValueChange={() => toggleSetting(settingKey)}
        trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#1c463a' }}
        thumbColor={settings[settingKey as keyof typeof settings] ? '#FFFFFF' : '#f4f3f4'}
      />
    </View>
  );

  const renderActionItem = (
    title: string,
    description: string,
    icon: string,
    color: string,
    onPress: () => void
  ) => (
    <TouchableOpacity style={styles.actionItem} onPress={onPress}>
      <View style={[styles.actionIcon, { backgroundColor: color }]}>
        <Ionicons name={icon as any} size={24} color="#FFFFFF" />
      </View>
      
      <View style={styles.actionContent}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionDescription}>{description}</Text>
      </View>
      
      <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* General Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>General Settings</Text>
        
        {renderSettingItem(
          'Email Notifications',
          'Send email notifications for important events',
          'emailNotifications',
          'mail'
        )}
        
        {renderSettingItem(
          'Push Notifications',
          'Send push notifications to mobile devices',
          'pushNotifications',
          'notifications'
        )}
        
        {renderSettingItem(
          'Auto Backup',
          'Automatically backup data daily',
          'autoBackup',
          'cloud-upload'
        )}
      </View>

      {/* Security Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security & Access</Text>
        
        {renderSettingItem(
          'Maintenance Mode',
          'Restrict access to administrators only',
          'maintenanceMode',
          'construct'
        )}
        
        {renderSettingItem(
          'Allow Guest Access',
          'Allow users to browse without logging in',
          'allowGuestAccess',
          'person-outline'
        )}
        
        {renderSettingItem(
          'Require Password Reset',
          'Force all users to reset passwords on next login',
          'requirePasswordReset',
          'key'
        )}
      </View>

      {/* System Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Actions</Text>
        
        {renderActionItem(
          'Export Data',
          'Export all system data to CSV format',
          'download',
          '#4CAF50',
          handleExportData
        )}
        
        {renderActionItem(
          'Backup Database',
          'Create a full backup of the database',
          'server',
          '#2196F3',
          handleBackupDatabase
        )}
        
        {renderActionItem(
          'Clear Cache',
          'Clear all cached data and temporary files',
          'refresh',
          '#FF9800',
          handleClearCache
        )}
      </View>

      {/* System Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Information</Text>
        
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>App Version:</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Database Version:</Text>
            <Text style={styles.infoValue}>PostgreSQL 14.2</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Backup:</Text>
            <Text style={styles.infoValue}>2024-01-20 03:00 AM</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Storage Used:</Text>
            <Text style={styles.infoValue}>2.4 GB / 10 GB</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Active Users:</Text>
            <Text style={styles.infoValue}>57 users</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 20,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(28, 70, 58, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  settingIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(28,70,58,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    shadowColor: '#1c463a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  settingDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
    fontWeight: '500',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  actionDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  infoLabel: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
