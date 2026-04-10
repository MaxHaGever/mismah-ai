interface LeakDetection {
    reportDate: string;
    propertyAddress: string;
    clientName: string;
    performedBy: string;
    licenseNumber: string;
    contactNumber: string;
    propertyType: string;
    contactExprience: string;
    overview: string;
    testTools: string[];
    leakLocations: {
        location: string;
        description: string;
    }[];
    recommendations: string[];
    additionalNotes: string
}

