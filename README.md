# Klab Program Manager - Unified Dashboard System

A comprehensive role-based web application for managing training programs, users, and educational sessions at kLab. Built with Next.js 14, TypeScript, and Tailwind CSS.

## 🎯 Project Overview

This is a unified dashboard system that adapts its content and functionality based on user roles. Instead of maintaining separate dashboards, we use conditional rendering to show role-specific features while maintaining a consistent UI/UX.

## 👥 User Roles & Permissions

### 1. **Super Admin** 🔧
- **User Management**: Create, edit, delete users across all roles
- **System Reports**: Analytics and system-wide statistics
- **Program Oversight**: View and manage all programs
- **Role Assignment**: Assign roles to users
- **System Settings**: Global configuration management

### 2. **Program Manager** 📊
- **Program Management**: Create, edit, and manage training programs
- **Trainee Assignment**: Assign trainees to programs
- **Facilitator Assignment**: Assign facilitators to programs
- **Program Analytics**: Track program performance and completion rates
- **Resource Management**: Manage learning materials and resources

### 3. **Facilitator** 👨‍🏫
- **My Programs**: View assigned programs and manage classes
- **Attendance Tracking**: Multiple methods (QR codes, online, in-person)
- **Curriculum Upload**: Upload and organize learning materials
- **Project Reviews**: Review and grade trainee submissions
- **Session Management**: Schedule and conduct training sessions

### 4. **Klab Trainee** 👨‍🎓
- **My Programs**: View enrolled programs and progress
- **Submit Projects**: Upload assignments and projects
- **Attendance History**: View personal attendance records
- **Learning Resources**: Access course materials and resources
- **Progress Tracking**: Monitor learning progress and grades

### 5. **IT Support** 🛠️
- **Technical Support**: Handle technical issues and requests
- **System Monitoring**: Monitor system health and performance
- **User Support**: Assist users with technical problems
- **Maintenance**: Perform system maintenance tasks
- **Troubleshooting**: Debug and resolve technical issues

## 🚀 Features

### Core Functionality
- **Role-Based Access Control**: Secure access based on user roles
- **Unified UI/UX**: Consistent design across all user types
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Theme**: Toggle between themes
- **Real-time Updates**: Live data updates and notifications

### Attendance System
- **QR Code Scanning**: Individual QR codes for each trainee
- **Online Sessions**: Virtual attendance tracking
- **In-Person Sessions**: Location-based attendance with GPS
- **Manual Entry**: Traditional attendance marking
- **Attendance Reports**: Comprehensive reporting and analytics

### Program Management
- **Program Creation**: Full program lifecycle management
- **Trainee Management**: Enroll, track, and manage trainees
- **Resource Management**: Upload and organize learning materials
- **Progress Tracking**: Monitor program and trainee progress
- **Analytics**: Comprehensive reporting and insights

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Context + Zustand
- **Authentication**: NextAuth.js (planned)
- **Database**: Prisma + PostgreSQL (planned)
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Date Handling**: date-fns
- **Themes**: next-themes

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm or pnpm

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd klab-program-manager
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
klab-program-manager/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Homepage (role-based dashboard)
│   ├── layout.tsx         # Root layout with role context
│   ├── globals.css        # Global styles
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Role-based dashboard
│   ├── programs/          # Program management
│   ├── users/             # User management (Admin)
│   ├── attendance/        # Attendance tracking
│   ├── curriculum/        # Curriculum management
│   ├── reviews/           # Project reviews
│   ├── reports/           # Analytics and reports
│   ├── settings/          # User settings
│   └── support/           # IT Support features
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui components
│   ├── layout/           # Layout components
│   │   ├── sidebar.tsx   # Role-based sidebar
│   │   ├── header.tsx    # Top navigation
│   │   └── layout.tsx    # Main layout wrapper
│   ├── role-based/       # Role-specific components
│   │   ├── admin/        # Super Admin components
│   │   ├── manager/      # Program Manager components
│   │   ├── facilitator/  # Facilitator components
│   │   ├── trainee/      # Trainee components
│   │   └── support/      # IT Support components
│   └── shared/           # Shared components
├── lib/                  # Utility functions
│   ├── auth.ts          # Authentication utilities
│   ├── roles.ts         # Role definitions and permissions
│   └── utils.ts         # General utilities
├── hooks/                # Custom React hooks
│   ├── useAuth.ts       # Authentication hook
│   ├── useRole.ts       # Role management hook
│   └── usePermissions.ts # Permission checking hook
├── types/                # TypeScript type definitions
│   ├── user.ts          # User and role types
│   ├── program.ts       # Program types
│   └── attendance.ts    # Attendance types
├── public/               # Static assets
└── styles/               # Additional styles
```

## 🔐 Role-Based System Implementation

### 1. **Role Context Provider**
```typescript
// lib/contexts/RoleContext.tsx
export const RoleContext = createContext<RoleContextType | undefined>(undefined)

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [userRole, setUserRole] = useState<UserRole>('trainee')
  const [permissions, setPermissions] = useState<Permission[]>([])

  // Role-based logic here
}
```

### 2. **Role-Based Sidebar**
```typescript
// components/layout/sidebar.tsx
export function Sidebar() {
  const { userRole } = useRole()
  
  const menuItems = getMenuItemsByRole(userRole)
  
  return (
    <nav>
      {menuItems.map(item => (
        <MenuItem key={item.id} {...item} />
      ))}
    </nav>
  )
}
```

### 3. **Protected Routes**
```typescript
// components/auth/ProtectedRoute.tsx
export function ProtectedRoute({ 
  children, 
  requiredRole 
}: ProtectedRouteProps) {
  const { userRole, hasPermission } = useRole()
  
  if (!hasPermission(requiredRole)) {
    return <AccessDenied />
  }
  
  return <>{children}</>
}
```

## 🎯 Key Features by Role

### Super Admin Dashboard
- **User Management**: CRUD operations for all users
- **System Analytics**: Comprehensive system reports
- **Role Management**: Assign and manage user roles
- **Program Oversight**: View all programs and statistics

### Program Manager Dashboard
- **Program Creation**: Create and manage training programs
- **Trainee Assignment**: Assign trainees to programs
- **Facilitator Management**: Assign facilitators to programs
- **Program Analytics**: Track program performance

### Facilitator Dashboard
- **My Programs**: View assigned programs
- **Attendance Tracking**: Multiple attendance methods
- **Curriculum Management**: Upload and organize materials
- **Project Reviews**: Grade trainee submissions

### Trainee Dashboard
- **My Programs**: View enrolled programs
- **Progress Tracking**: Monitor learning progress
- **Submit Projects**: Upload assignments
- **Access Resources**: View learning materials

### IT Support Dashboard
- **Support Tickets**: Handle technical issues
- **System Monitoring**: Monitor system health
- **User Support**: Assist users with problems
- **Maintenance**: Perform system maintenance

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file:

```env
# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Database (when implemented)
DATABASE_URL=your-database-url

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Role Configuration
```typescript
// lib/roles.ts
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  PROGRAM_MANAGER: 'program_manager',
  FACILITATOR: 'facilitator',
  TRAINEE: 'trainee',
  IT_SUPPORT: 'it_support'
} as const

export const PERMISSIONS = {
  MANAGE_USERS: 'manage_users',
  MANAGE_PROGRAMS: 'manage_programs',
  VIEW_REPORTS: 'view_reports',
  // ... more permissions
}
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Deploy to Vercel
1. Connect your repository to Vercel
2. Vercel will automatically detect Next.js
3. Deploy with default settings

## 🐛 Troubleshooting

### Common Issues

**SWC Binary Error on Windows**
```bash
Remove-Item -Recurse -Force node_modules
npm install --legacy-peer-deps
```

**Role-Based Access Issues**
- Check role context provider setup
- Verify permission configurations
- Ensure proper route protection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly across all roles
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**Built with ❤️ for kLab - Empowering Rwanda's Tech Community** 