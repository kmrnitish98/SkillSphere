import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem('skillsphere_user');
    if (stored) {
      const parsedUser = JSON.parse(stored);
      setUser(parsedUser);
      if (parsedUser.role === 'student' && parsedUser.token) {
        import('../services/api').then((api) => {
          api.getMyPayments().then(res => {
            const courseIds = res.data?.data?.map(p => typeof p.course === 'object' ? p.course._id : p.course) || [];
            setEnrolledCourseIds(courseIds);
          }).catch(err => console.error("Error fetching enrolled courses", err));
        });
      }
    }
    setLoading(false);
  }, []);

  const loginUser = (userData) => {
    localStorage.setItem('skillsphere_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('skillsphere_user');
    setUser(null);
    setEnrolledCourseIds([]);
  };

  const updateUser = (updatedFields) => {
    const merged = { ...user, ...updatedFields };
    localStorage.setItem('skillsphere_user', JSON.stringify(merged));
    setUser(merged);
  };

  return (
    <AuthContext.Provider value={{ user, loading, enrolledCourseIds, loginUser, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
