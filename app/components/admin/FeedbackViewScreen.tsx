import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FeedbackViewScreenProps {
  onBack: () => void;
}

export function FeedbackViewScreen({ onBack }: FeedbackViewScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  
  // Mock feedback data
  const [feedbackList] = useState([
    {
      id: 1,
      studentName: 'Emma Johnson',
      instructorName: 'Maria Garcia',
      sessionDate: '2024-01-20',
      sessionRating: 4,
      homeworkRating: 5,
      generalNotes: 'Excellent progress on scales. Emma is showing great improvement in finger technique.',
      homeworkFeedback: 'All exercises completed with good accuracy. Practice more on the challenging passages.',
      sessionFiles: ['Recording_Emma_Jan20.mp3'],
    },
    {
      id: 2,
      studentName: 'Alex Thompson',
      instructorName: 'John Smith',
      sessionDate: '2024-01-19',
      sessionRating: 3,
      homeworkRating: 3,
      generalNotes: 'Good effort but needs more practice on rhythm. Focus on metronome work.',
      homeworkFeedback: 'Some exercises incomplete. Need to work on consistency.',
      sessionFiles: [],
    },
    {
      id: 3,
      studentName: 'Sarah Wilson',
      instructorName: 'Maria Garcia',
      sessionDate: '2024-01-18',
      sessionRating: 5,
      homeworkRating: 4,
      generalNotes: 'Outstanding performance! Ready to move to intermediate level pieces.',
      homeworkFeedback: 'Excellent work on Bach invention. Minor timing issues to address.',
      sessionFiles: ['Sheet_Music_Sarah.pdf', 'Performance_Sarah.mp4'],
    },
  ]);

  const filteredFeedback = feedbackList.filter(feedback => {
    const matchesSearch = feedback.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         feedback.instructorName.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedFilter === 'all') return matchesSearch;
    if (selectedFilter === 'high') return matchesSearch && feedback.sessionRating >= 4;
    if (selectedFilter === 'low') return matchesSearch && feedback.sessionRating <= 2;
    
    return matchesSearch;
  });

  const renderRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Ionicons
        key={index}
        name={index < rating ? 'star' : 'star-outline'}
        size={16}
        color={index < rating ? '#FFD700' : 'rgba(255,255,255,0.3)'}
      />
    ));
  };

  const renderFeedbackCard = (feedback: any) => (
    <View key={feedback.id} style={styles.feedbackCard}>
      <View style={styles.feedbackHeader}>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{feedback.studentName}</Text>
          <Text style={styles.instructorName}>with {feedback.instructorName}</Text>
          <Text style={styles.sessionDate}>{feedback.sessionDate}</Text>
        </View>
        
        <View style={styles.ratingsContainer}>
          <View style={styles.ratingRow}>
            <Text style={styles.ratingLabel}>Session:</Text>
            <View style={styles.stars}>
              {renderRatingStars(feedback.sessionRating)}
            </View>
          </View>
          <View style={styles.ratingRow}>
            <Text style={styles.ratingLabel}>Homework:</Text>
            <View style={styles.stars}>
              {renderRatingStars(feedback.homeworkRating)}
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.feedbackContent}>
        <View style={styles.feedbackSection}>
          <Text style={styles.feedbackSectionTitle}>General Notes</Text>
          <Text style={styles.feedbackText}>{feedback.generalNotes}</Text>
        </View>
        
        <View style={styles.feedbackSection}>
          <Text style={styles.feedbackSectionTitle}>Homework Feedback</Text>
          <Text style={styles.feedbackText}>{feedback.homeworkFeedback}</Text>
        </View>
        
        {feedback.sessionFiles.length > 0 && (
          <View style={styles.feedbackSection}>
            <Text style={styles.feedbackSectionTitle}>Session Files</Text>
            {feedback.sessionFiles.map((file: string, index: number) => (
              <View key={index} style={styles.fileItem}>
                <Ionicons 
                  name={file.includes('.mp3') ? 'musical-notes' : 
                        file.includes('.pdf') ? 'document-text' : 'videocam'} 
                  size={16} 
                  color="#4CAF50" 
                />
                <Text style={styles.fileName}>{file}</Text>
                <TouchableOpacity style={styles.downloadButton}>
                  <Ionicons name="download" size={14} color="#2196F3" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="rgba(255,255,255,0.6)" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search feedback..."
          placeholderTextColor="rgba(255,255,255,0.6)"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text style={[styles.filterText, selectedFilter === 'all' && styles.filterTextActive]}>
            All Feedback
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterButton, selectedFilter === 'high' && styles.filterButtonActive]}
          onPress={() => setSelectedFilter('high')}
        >
          <Text style={[styles.filterText, selectedFilter === 'high' && styles.filterTextActive]}>
            High Ratings
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterButton, selectedFilter === 'low' && styles.filterButtonActive]}
          onPress={() => setSelectedFilter('low')}
        >
          <Text style={[styles.filterText, selectedFilter === 'low' && styles.filterTextActive]}>
            Needs Attention
          </Text>
        </TouchableOpacity>
      </View>

      {/* Feedback List */}
      <ScrollView style={styles.feedbackList} showsVerticalScrollIndicator={false}>
        {filteredFeedback.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyText}>No feedback found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search or filter</Text>
          </View>
        ) : (
          filteredFeedback.map(renderFeedbackCard)
        )}
      </ScrollView>
    </View>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 17,
    marginLeft: 16,
    fontWeight: '500',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  filterButtonActive: {
    backgroundColor: 'rgba(28,70,58,0.6)',
    borderColor: 'rgba(28,70,58,0.8)',
    shadowColor: '#1c463a',
    shadowOpacity: 0.3,
  },
  filterText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  feedbackList: {
    flex: 1,
  },
  feedbackCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  instructorName: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
    fontWeight: '600',
  },
  sessionDate: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  ratingsContainer: {
    alignItems: 'flex-end',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginRight: 8,
    minWidth: 60,
  },
  stars: {
    flexDirection: 'row',
  },
  feedbackContent: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 16,
  },
  feedbackSection: {
    marginBottom: 16,
  },
  feedbackSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  feedbackText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 4,
  },
  fileName: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 8,
  },
  downloadButton: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 18,
    fontWeight: '500',
    marginTop: 16,
  },
  emptySubtext: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    marginTop: 8,
  },
});
