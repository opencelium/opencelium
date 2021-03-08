
export const BUSINESS_NODES = [
    {
        id: "1",
        size: 150,
        label: "Get Clients",
        color: "#FFCFCF",
        shape: "box",
        font: { face: "monospace", align: "left" },
        x: 34,
        y: 92,
    },
    {
        id: "2",
        size: 150,
        label: "Save Tickets",
        color: "#FFCFCF",
        shape: "box",
        font: { face: "monospace", align: "left" },
        x: 300,
        y: 200,
    },
];
export const BUSINESS_EDGES = [
    {
        from: "1",
        to: "2",
        arrows: "to",
        physics: false,
        smooth: { type: "cubicBezier" },
    },
];

export const PROGRAM_NODES = [
    {
        id: "1",
        size: 150,
        label: "cmdb.objects.read",
        color: "#FFCFCF",
        shape: "box",
        font: { face: "monospace", align: "left" },
        x: 100,
        y: 100,
    },
    {
        id: "2",
        size: 150,
        label: "saveTickets",
        color: "#FFCFCF",
        shape: "box",
        font: { face: "monospace", align: "left" },
        x: 300,
        y: 100,
    },
];
export const PROGRAM_EDGES = [
    {
        from: "1",
        to: "2",
        arrows: "to",
        physics: false,
        smooth: { type: "cubicBezier" },
    },
];
