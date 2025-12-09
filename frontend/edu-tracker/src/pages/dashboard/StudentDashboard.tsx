import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingScreen from '../../components/LoadingScreen';
import { authService } from '../../services/auth.service';
import { ChevronRight, PlayCircle } from 'lucide-react';

const StudentDashboard = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading for better UX
    setTimeout(() => setLoading(false), 1000);
  }, []);

  if (loading) return <LoadingScreen message="Preparing your learning space..." />;

  const user = authService.getCurrentUser();
  const orgName = authService.getOrganizationName();

  return (
    <DashboardLayout role="student" userName={user?.firstName || "Student"} organizationName={orgName}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Welcome Banner */}
        <div className="bg-[#1E293B] rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-2">Ready to learn, {user?.firstName}?</h2>
            <p className="text-blue-200 mb-6 max-w-lg">You have 3 assignments due this week and 1 upcoming quiz. Keep up the great work!</p>
            <button className="bg-white text-[#1E293B] px-6 py-2 rounded-full font-semibold hover:bg-blue-50 transition-colors">
              View Schedule
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* My Courses */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">My Courses</h3>
              <button className="text-sm text-blue-600 font-medium hover:underline">View All</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: 'Advanced Mathematics', progress: 75, color: 'bg-blue-500', icon: '📐' },
                { title: 'World History', progress: 45, color: 'bg-orange-500', icon: '🌍' },
                { title: 'Physics 101', progress: 90, color: 'bg-purple-500', icon: '⚡' },
                { title: 'English Literature', progress: 60, color: 'bg-green-500', icon: '📚' },
              ].map((course, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-xl ${course.color} bg-opacity-10 flex items-center justify-center text-2xl`}>
                      {course.icon}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#1E293B] group-hover:text-white transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">{course.title}</h4>
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                    <div 
                      className={`h-2 rounded-full ${course.color}`} 
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 font-medium">{course.progress}% Completed</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Sidebar: Upcoming */}
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Up Next</h3>
              <div className="space-y-6">
                {[
                  { title: 'Math Quiz', time: '10:00 AM', type: 'Quiz', color: 'text-red-500 bg-red-50' },
                  { title: 'History Essay', time: '2:00 PM', type: 'Assignment', color: 'text-blue-500 bg-blue-50' },
                  { title: 'Physics Lab', time: 'Tomorrow', type: 'Class', color: 'text-purple-500 bg-purple-50' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="flex flex-col items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${item.color.split(' ')[0].replace('text', 'bg')}`}></div>
                      <div className="w-0.5 h-full bg-gray-100"></div>
                    </div>
                    <div className="pb-6">
                      <h4 className="font-semibold text-gray-900 text-sm">{item.title}</h4>
                      <p className="text-xs text-gray-500 mb-1">{item.time}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.color}`}>
                        {item.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#1E293B] p-6 rounded-2xl text-white shadow-lg">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <PlayCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Continue Watching</p>
                  <h4 className="font-bold text-sm">Intro to Calculus</h4>
                </div>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5 mb-2">
                 <div className="bg-blue-400 h-1.5 rounded-full w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
