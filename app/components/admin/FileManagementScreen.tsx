import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface FileManagementScreenProps {
  onBack: () => void;
}

export function FileManagementScreen({ onBack }: FileManagementScreenProps) {
  const [files, setFiles] = useState([
    {
      id: 1,
      name: 'Bach - Invention No. 1.pdf',
      type: 'pdf',
      size: '2.4 MB',
      uploadDate: '2024-01-15',
      category: 'Sheet Music',
    },
    {
      id: 2,
      name: 'Chopin - Nocturne Op. 9 No. 2.mp3',
      type: 'audio',
      size: '5.8 MB',
      uploadDate: '2024-01-14',
      category: 'Audio',
    },
    {
      id: 3,
      name: 'Piano Scales Practice.pdf',
      type: 'pdf',
      size: '1.2 MB',
      uploadDate: '2024-01-13',
      category: 'Exercises',
    },
  ]);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return 'document-text';
      case 'audio':
        return 'musical-notes';
      case 'video':
        return 'videocam';
      default:
        return 'document';
    }
  };

  const getFileColor = (type: string) => {
    switch (type) {
      case 'pdf':
        return '#F44336';
      case 'audio':
        return '#4CAF50';
      case 'video':
        return '#2196F3';
      default:
        return '#9E9E9E';
    }
  };

  const handleUploadFile = () => {
    Alert.alert('Upload File', 'File upload functionality will be implemented here');
  };

  const handleDeleteFile = (file: any) => {
    Alert.alert(
      'Delete File',
      `Are you sure you want to delete "${file.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => {
            setFiles(files.filter(f => f.id !== file.id));
            Alert.alert('Success', 'File deleted successfully');
          }
        },
      ]
    );
  };

  const renderFileCard = (file: any) => (
    <View key={file.id} style={styles.fileCard}>
      <View style={styles.fileHeader}>
        <View style={[styles.fileIcon, { backgroundColor: getFileColor(file.type) }]}>
          <Ionicons name={getFileIcon(file.type) as any} size={24} color="#FFFFFF" />
        </View>
        
        <View style={styles.fileInfo}>
          <Text style={styles.fileName}>{file.name}</Text>
          <Text style={styles.fileDetails}>
            {file.size} • {file.category} • {file.uploadDate}
          </Text>
        </View>
        
        <View style={styles.fileActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="download" size={18} color="#4CAF50" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="eye" size={18} color="#2196F3" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleDeleteFile(file)}
          >
            <Ionicons name="trash" size={18} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Upload Button */}
      <TouchableOpacity style={styles.uploadButton} onPress={handleUploadFile}>
        <Ionicons name="cloud-upload" size={20} color="#FFFFFF" />
        <Text style={styles.uploadButtonText}>Upload New File</Text>
      </TouchableOpacity>

      {/* File Categories */}
      <View style={styles.categoriesContainer}>
        <Text style={styles.sectionTitle}>File Categories</Text>
        <View style={styles.categoriesGrid}>
          <View style={styles.categoryCard}>
            <Ionicons name="musical-notes" size={32} color="#4CAF50" />
            <Text style={styles.categoryLabel}>Audio Files</Text>
            <Text style={styles.categoryCount}>24 files</Text>
          </View>
          
          <View style={styles.categoryCard}>
            <Ionicons name="document-text" size={32} color="#F44336" />
            <Text style={styles.categoryLabel}>Sheet Music</Text>
            <Text style={styles.categoryCount}>67 files</Text>
          </View>
          
          <View style={styles.categoryCard}>
            <Ionicons name="videocam" size={32} color="#2196F3" />
            <Text style={styles.categoryLabel}>Video Lessons</Text>
            <Text style={styles.categoryCount}>15 files</Text>
          </View>
          
          <View style={styles.categoryCard}>
            <Ionicons name="library" size={32} color="#FF9800" />
            <Text style={styles.categoryLabel}>Exercises</Text>
            <Text style={styles.categoryCount}>32 files</Text>
          </View>
        </View>
      </View>

      {/* Files List */}
      <View style={styles.filesContainer}>
        <Text style={styles.sectionTitle}>Recent Files</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {files.map(renderFileCard)}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 20,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1c463a',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 24,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  categoriesContainer: {
    marginBottom: 32,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: (width - 60) / 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  categoryCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  filesContainer: {
    flex: 1,
  },
  fileCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  fileDetails: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  fileActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});
