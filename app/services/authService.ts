import { supabase } from '../../supabase.js';

export interface Admin {
  id: string;
  name: string;
  email: string;
  password: string;
}

export interface Student {
  id?: string;
  name: string;
  instrument: string;
  avatar?: string;
  color?: string;
  student_email: string;
  father_email?: string;
  mother_email?: string;
  online_instructor_name?: string;
  theory_instructor_name?: string;
  in_person_name?: string;
  online_instructor_id?: string;
  theory_instructor_id?: string;
  in_person_id?: string;
  password: string;
  father_phone?: string;
  mother_phone?: string;
  student_phone_number?: string;
  second_inperson_id?: string;
  second_inperson_name?: string;
}

export interface Instructor {
  id?: string;
  name: string;
  email: string;
  avatar?: string;
  color?: string;
  role: string;
  password: string;
  type?: string;
  phone?: string;
  role2?: string;
}

export type UserType = 'admin' | 'student' | 'instructor';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  userType: UserType;
  userData: Admin | Student | Instructor;
}

class AuthService {
  /**
   * Authenticate user by checking all three tables
   */
  async login(email: string, password: string): Promise<AuthUser | null> {
    try {
      console.log('AuthService: Starting login process for:', email);
      
      // First, try to authenticate as admin
      console.log('AuthService: Checking admin table...');
      const adminResult = await this.loginAsAdmin(email, password);
      if (adminResult) {
        console.log('AuthService: Admin login successful');
        return adminResult;
      }

      // Then, try to authenticate as student
      console.log('AuthService: Checking student table...');
      const studentResult = await this.loginAsStudent(email, password);
      if (studentResult) {
        console.log('AuthService: Student login successful');
        return studentResult;
      }

      // Finally, try to authenticate as instructor
      console.log('AuthService: Checking instructor table...');
      const instructorResult = await this.loginAsInstructor(email, password);
      if (instructorResult) {
        console.log('AuthService: Instructor login successful');
        return instructorResult;
      }

      // No user found in any table
      console.log('AuthService: No user found in any table');
      return null;
    } catch (error) {
      console.error('AuthService: Login error:', error);
      throw new Error('Authentication failed. Please try again.');
    }
  }

  /**
   * Try to authenticate as admin
   */
  private async loginAsAdmin(email: string, password: string): Promise<AuthUser | null> {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      userType: 'admin',
      userData: data as Admin
    };
  }

  /**
   * Try to authenticate as student
   */
  private async loginAsStudent(email: string, password: string): Promise<AuthUser | null> {
    // Students can login with student_email, father_email, or mother_email
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .or(`student_email.eq.${email},father_email.eq.${email},mother_email.eq.${email}`)
      .eq('password', password);

    if (error || !data || data.length === 0) {
      return null;
    }

    const student = data[0];
    return {
      id: student.id || student.student_email,
      name: student.name,
      email: student.student_email,
      userType: 'student',
      userData: student as Student
    };
  }

  /**
   * Try to authenticate as instructor
   */
  private async loginAsInstructor(email: string, password: string): Promise<AuthUser | null> {
    const { data, error } = await supabase
      .from('instructors')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id || data.email,
      name: data.name,
      email: data.email,
      userType: 'instructor',
      userData: data as Instructor
    };
  }

  /**
   * Get user profile by ID and type
   */
  async getUserProfile(userId: string, userType: UserType): Promise<AuthUser | null> {
    try {
      switch (userType) {
        case 'admin':
          const { data: adminData, error: adminError } = await supabase
            .from('admins')
            .select('*')
            .eq('id', userId)
            .single();

          if (adminError || !adminData) return null;

          return {
            id: adminData.id,
            name: adminData.name,
            email: adminData.email,
            userType: 'admin',
            userData: adminData as Admin
          };

        case 'student':
          const { data: studentData, error: studentError } = await supabase
            .from('students')
            .select('*')
            .eq('id', userId)
            .single();

          if (studentError || !studentData) return null;

          return {
            id: studentData.id || studentData.student_email,
            name: studentData.name,
            email: studentData.student_email,
            userType: 'student',
            userData: studentData as Student
          };

        case 'instructor':
          const { data: instructorData, error: instructorError } = await supabase
            .from('instructors')
            .select('*')
            .eq('id', userId)
            .single();

          if (instructorError || !instructorData) return null;

          return {
            id: instructorData.id || instructorData.email,
            name: instructorData.name,
            email: instructorData.email,
            userType: 'instructor',
            userData: instructorData as Instructor
          };

        default:
          return null;
      }
    } catch (error) {
      console.error('Get user profile error:', error);
      return null;
    }
  }

  /**
   * Update user password
   */
  async updatePassword(userId: string, userType: UserType, newPassword: string): Promise<boolean> {
    try {
      const tableName = userType === 'admin' ? 'admins' : 
                       userType === 'student' ? 'students' : 'instructors';

      const { error } = await supabase
        .from(tableName)
        .update({ password: newPassword })
        .eq('id', userId);

      return !error;
    } catch (error) {
      console.error('Update password error:', error);
      return false;
    }
  }

  /**
   * Check if email exists in any table
   */
  async checkEmailExists(email: string): Promise<{ exists: boolean; userType?: UserType }> {
    try {
      // Check admins
      const { data: adminData } = await supabase
        .from('admins')
        .select('id')
        .eq('email', email)
        .single();

      if (adminData) {
        return { exists: true, userType: 'admin' };
      }

      // Check students (multiple email fields)
      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .or(`student_email.eq.${email},father_email.eq.${email},mother_email.eq.${email}`)
        .single();

      if (studentData) {
        return { exists: true, userType: 'student' };
      }

      // Check instructors
      const { data: instructorData } = await supabase
        .from('instructors')
        .select('id')
        .eq('email', email)
        .single();

      if (instructorData) {
        return { exists: true, userType: 'instructor' };
      }

      return { exists: false };
    } catch (error) {
      console.error('Check email exists error:', error);
      return { exists: false };
    }
  }
}

export const authService = new AuthService();
