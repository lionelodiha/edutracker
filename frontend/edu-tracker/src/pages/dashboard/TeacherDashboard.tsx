import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingScreen from '../../components/LoadingScreen';
import { authService } from '../../services/auth.service';
import { Users, BookOpen, CheckCircle, MoreVertical, Plus } from 'lucide-react';

const TeacherDashboard = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  if (loading) return <LoadingScreen message="Loading Teacher Dashboard..." />;

  const user = authService.getCurrentUser();
  const orgName = authService.getOrganizationName();

  return (
    <DashboardLayout role="teacher" userName={user?.firstName || "Teacher"} organizationName={orgName}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-4 bg-blue-50 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Students</p>
              <h3 className="text-2xl font-bold text-gray-900">120</h3>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-4 bg-purple-50 rounded-xl">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Courses</p>
              <h3 className="text-2xl font-bold text-gray-900">4</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-4 bg-green-50 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Overall Grade</p>
              <h3 className="text-2xl font-bold text-gray-900">85%</h3>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart Section (Placeholder) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Performance</h3>
              <select className="bg-gray-50 border-none text-sm font-medium text-gray-500 rounded-lg p-2 outline-none">
                <option>This Year</option>
                <option>Last Year</option>
              </select>
            </div>
            {/* Mock Chart Area */}
            <div className="h-64 flex items-end justify-between px-4 gap-2">
               {/* Simulating a wave chart with bars for now since we don't have a chart lib installed yet */}
               {[40, 60, 45, 70, 65, 80, 75, 90, 85, 95, 100, 90].map((h, i) => (
                  <div key={i} className="w-full bg-blue-100 rounded-t-lg relative group">
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-blue-500 rounded-t-lg transition-all duration-500 hover:bg-blue-600"
                      style={{ height: `${h}%` }}
                    ></div>
                  </div>
               ))}
            </div>
            <div className="flex justify-between mt-4 text-xs text-gray-400 font-medium">
              <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
              <span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
            </div>
          </div>

          {/* Right Column: Attendance & Actions */}
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Attendance</h3>
              <div className="flex items-end justify-between h-40 gap-3">
                 {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, i) => (
                   <div key={day} className="flex flex-col items-center gap-2 flex-1">
                      <div className="w-full bg-gray-100 rounded-lg h-full relative overflow-hidden">
                        <div 
                          className="absolute bottom-0 w-full bg-[#1E293B] rounded-lg"
                          style={{ height: `${[80, 95, 85, 90, 75][i]}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 font-medium">{day}</span>
                   </div>
                 ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Quick Actions</h3>
              <button className="w-full py-3 bg-blue-50 text-blue-600 font-semibold rounded-xl hover:bg-blue-100 transition-colors flex items-center justify-center gap-2">
                <Plus className="w-5 h-5" /> Add Course
              </button>
              <button className="w-full py-3 bg-[#1E293B] text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-gray-900/20">
                 Create Assignment
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section: Assignments & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Assignments to Grade</h3>
                <button className="text-sm text-blue-600 font-medium hover:underline">View All</button>
             </div>
             <div className="space-y-4">
               {[
                 { title: 'Essay: Hamlet', course: 'Literature', date: 'Due Yesterday' },
                 { title: 'Week 5: Homework', course: 'Algebra', date: 'Due Today' },
                 { title: 'Lab Report: Diffusion', course: 'Biology', date: 'Due Tomorrow' },
               ].map((item, i) => (
                 <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors group cursor-pointer border border-transparent hover:border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                        {item.course[0]}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{item.title}</h4>
                        <p className="text-xs text-gray-500">{item.course}</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium px-3 py-1 bg-red-50 text-red-600 rounded-full">
                      {item.date}
                    </span>
                 </div>
               ))}
             </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
                <MoreVertical className="w-5 h-5 text-gray-400 cursor-pointer" />
             </div>
             <div className="space-y-6">
                {[
                  { text: 'You graded Assignment 3 in Physics 201', time: '2 hours ago', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
                  { text: 'John Smith enrolled in Biology 101', time: '4 hours ago', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
                  { text: 'New message from Emily Johnson', time: 'Yesterday', icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className={`w-10 h-10 rounded-full ${item.bg} flex items-center justify-center shrink-0`}>
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.text}</p>
                      <p className="text-xs text-gray-400 mt-1">{item.time}</p>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeacherDashboard;
