import {AppLayout} from "@/components/app-layout";
import React from "react";


export default function DealDeskLayout({children}: {children: React.ReactNode}) {
    return <AppLayout>{children}</AppLayout>
}