import { supabase } from '../../supabase.js';

export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    
    // Test connection by trying to fetch from each table
    const adminTest = await supabase.from('admins').select('count', { count: 'exact' });
    console.log('Admins table connection:', adminTest.error ? 'FAILED' : 'SUCCESS', adminTest.count);
    
    const studentTest = await supabase.from('students').select('count', { count: 'exact' });
    console.log('Students table connection:', studentTest.error ? 'FAILED' : 'SUCCESS', studentTest.count);
    
    const instructorTest = await supabase.from('instructors').select('count', { count: 'exact' });
    console.log('Instructors table connection:', instructorTest.error ? 'FAILED' : 'SUCCESS', instructorTest.count);
    
    return {
      admins: !adminTest.error,
      students: !studentTest.error,
      instructors: !instructorTest.error
    };
  } catch (error) {
    console.error('Connection test failed:', error);
    return {
      admins: false,
      students: false,
      instructors: false
    };
  }
};

export const testLogin = async (email: string, password: string) => {
  try {
    console.log(`Testing login for: ${email}`);
    
    // Test admin login
    const adminResult = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .eq('password', password);
    
    console.log('Admin query result:', {
      error: adminResult.error,
      dataLength: adminResult.data?.length || 0,
      data: adminResult.data
    });
    
    // Test student login
    const studentResult = await supabase
      .from('students')
      .select('*')
      .or(`student_email.eq.${email},father_email.eq.${email},mother_email.eq.${email}`)
      .eq('password', password);
    
    console.log('Student query result:', {
      error: studentResult.error,
      dataLength: studentResult.data?.length || 0,
      data: studentResult.data
    });
    
    // Test instructor login
    const instructorResult = await supabase
      .from('instructors')
      .select('*')
      .eq('email', email)
      .eq('password', password);
    
    console.log('Instructor query result:', {
      error: instructorResult.error,
      dataLength: instructorResult.data?.length || 0,
      data: instructorResult.data
    });
    
  } catch (error) {
    console.error('Login test failed:', error);
  }
};
