import UserManagementClientPage from "@/components/user-management/user-management-client";

export default function UsersManagementPage() {
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-2 mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Portal User Management</h1>
                <p className="text-muted-foreground">
                    Manage the user accounts for Paiperless Portal
                </p>
            </div>
            <UserManagementClientPage/>
        </div>
    );
}