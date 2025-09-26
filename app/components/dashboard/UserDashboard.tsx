import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../login/AuthContext';
import { Admin, Student, Instructor } from '../../services/authService';

export default function UserDashboard() {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No user data available</Text>
      </View>
    );
  }

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const renderUserInfo = () => {
    switch (user.userType) {
      case 'student':
        return <StudentDashboard student={user.userData as Student} />;
      case 'instructor':
        return <InstructorDashboard instructor={user.userData as Instructor} />;
      default:
        return <Text style={styles.errorText}>Unknown user type</Text>;
    }
  };

  // Admin users are handled by routing to /admin, so they shouldn't reach here
  if (user.userType === 'admin') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Admin users should be routed to admin panel</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.nameText}>{user.name}</Text>
          <Text style={styles.roleText}>{user.userType.toUpperCase()}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* User-specific content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderUserInfo()}
      </ScrollView>
    </View>
  );
}

// Student Dashboard Component
function StudentDashboard({ student }: { student: Student }) {
  return (
    <View style={styles.dashboardContainer}>
      <Text style={styles.sectionTitle}>Student Dashboard</Text>
      
      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>Student Information</Text>
        <Text style={styles.infoText}>Name: {student.name}</Text>
        <Text style={styles.infoText}>Email: {student.student_email}</Text>
        <Text style={styles.infoText}>Instrument: {student.instrument}</Text>
        {student.color && <Text style={styles.infoText}>Color: {student.color}</Text>}
      </View>

      {/* Instructors Information */}
      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>Your Instructors</Text>
        {student.online_instructor_name && (
          <Text style={styles.infoText}>Online: {student.online_instructor_name}</Text>
        )}
        {student.theory_instructor_name && (
          <Text style={styles.infoText}>Theory: {student.theory_instructor_name}</Text>
        )}
        {student.in_person_name && (
          <Text style={styles.infoText}>In-Person: {student.in_person_name}</Text>
        )}
        {student.second_inperson_name && (
          <Text style={styles.infoText}>Second In-Person: {student.second_inperson_name}</Text>
        )}
      </View>

      {/* Contact Information */}
      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>Contact Information</Text>
        {student.student_phone_number && (
          <Text style={styles.infoText}>Student Phone: {student.student_phone_number}</Text>
        )}
        {student.father_email && (
          <Text style={styles.infoText}>Father Email: {student.father_email}</Text>
        )}
        {student.father_phone && (
          <Text style={styles.infoText}>Father Phone: {student.father_phone}</Text>
        )}
        {student.mother_email && (
          <Text style={styles.infoText}>Mother Email: {student.mother_email}</Text>
        )}
        {student.mother_phone && (
          <Text style={styles.infoText}>Mother Phone: {student.mother_phone}</Text>
        )}
      </View>

      <View style={styles.actionsGrid}>
        <TouchableOpacity style={styles.actionCard}>
          <Text style={styles.actionTitle}>My Lessons</Text>
          <Text style={styles.actionSubtitle}>View upcoming lessons</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionCard}>
          <Text style={styles.actionTitle}>Practice Log</Text>
          <Text style={styles.actionSubtitle}>Track your practice time</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionCard}>
          <Text style={styles.actionTitle}>Assignments</Text>
          <Text style={styles.actionSubtitle}>View homework and tasks</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionCard}>
          <Text style={styles.actionTitle}>Progress</Text>
          <Text style={styles.actionSubtitle}>See your improvement</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Instructor Dashboard Component
function InstructorDashboard({ instructor }: { instructor: Instructor }) {
  return (
    <View style={styles.dashboardContainer}>
      <Text style={styles.sectionTitle}>Instructor Dashboard</Text>
      
      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>Instructor Information</Text>
        <Text style={styles.infoText}>Name: {instructor.name}</Text>
        <Text style={styles.infoText}>Email: {instructor.email}</Text>
        <Text style={styles.infoText}>Role: {instructor.role}</Text>
        {instructor.role2 && <Text style={styles.infoText}>Second Role: {instructor.role2}</Text>}
        {instructor.type && <Text style={styles.infoText}>Type: {instructor.type}</Text>}
        {instructor.phone && <Text style={styles.infoText}>Phone: {instructor.phone}</Text>}
        {instructor.color && <Text style={styles.infoText}>Color: {instructor.color}</Text>}
      </View>

      <View style={styles.actionsGrid}>
        <TouchableOpacity style={styles.actionCard}>
          <Text style={styles.actionTitle}>My Students</Text>
          <Text style={styles.actionSubtitle}>View assigned students</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionCard}>
          <Text style={styles.actionTitle}>Schedule</Text>
          <Text style={styles.actionSubtitle}>Manage lesson schedule</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionCard}>
          <Text style={styles.actionTitle}>Lesson Plans</Text>
          <Text style={styles.actionSubtitle}>Create and manage lessons</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionCard}>
          <Text style={styles.actionTitle}>Student Progress</Text>
          <Text style={styles.actionSubtitle}>Track student development</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#1c463a',
  },
  welcomeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
  },
  nameText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  roleText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    opacity: 0.8,
  },
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  dashboardContainer: {
    flex: 1,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 6,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  actionCard: {
    width: '48%',
    backgroundColor: 'rgba(28,70,58,0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  actionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  actionSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
});
