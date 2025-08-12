"use client";

import type { Customer } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Globe, HardDrive, MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";

interface CustomerDetailsProps {
    customer: Customer;
}

export function CustomerDetails({ customer }: CustomerDetailsProps) {
    const details = [
        { icon: Globe, label: "IP Address", value: customer.ipAddress },
        { icon: HardDrive, label: "Device", value: customer.device },
        { icon: MapPin, label: "Location", value: customer.location },
        { icon: Calendar, label: "First Seen", value: format(new Date(customer.firstSeen), "PPP") },
    ];
    
    return (
        <aside className="w-80 border-l bg-muted/20 p-6 flex flex-col gap-6">
            <div className="text-center flex flex-col items-center">
                <Avatar className="h-24 w-24 border-2 border-primary mb-4">
                    <AvatarImage src={customer.avatar} />
                    <AvatarFallback>{customer.name[0]}</AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-bold">{customer.name}</h2>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Customer Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {details.map(detail => (
                        <div key={detail.label} className="flex items-start gap-3 text-sm">
                            <detail.icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div>
                                <p className="text-muted-foreground">{detail.label}</p>
                                <p className="font-medium">{detail.value}</p>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="text-base">Session History</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground text-center">No past sessions with this customer.</p>
                </CardContent>
            </Card>
        </aside>
    );
}
