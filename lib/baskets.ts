export interface CourseBasket {
  id: string;
  name: string;
  courseCodes: string[];
}

export const COURSE_BASKETS: CourseBasket[] = [
  {
    id: "25bce",
    name: "25BCE (CSE)",
    courseCodes: [
      "STS2011",
      "MGT1040",
      "ECS2003",
      "MAT1010",
      "CSE2008",
      "CSE2007",
      "CSE1005",
      "CSE1022"
    ]
  },
  {
    id: "25bca",
    name: "25BCA (AIML)",
    courseCodes: [
      "STS2011",
      "MGT1040",
      "ECS2003",
      "CSE2008",
      "CSE2007",
      "CSE3008",
      "CSE1005",
      "CSE1022"
    ]
  },
  {
    id: "25bec",
    name: "25BEC (ECE)",
    courseCodes: [
      "MAT1010",
      "STS2011",
      "MGT1040",
      "ECS2003",
      "ECE2003",
      "ECE2006",
      "ECE2016",
      "ECE2009",
      "ECE3006"
    ]
  },
  {
    id: "25bes",
    name: "25BES (ECE ES)",
    courseCodes: [
      "MAT1010",
      "STS2011",
      "MGT1040",
      "ECS2003",
      "ECE2003",
      "ECE2006",
      "ECE2016",
      "ECE2009"
    ]
  },
  {
    id: "2026-cse",
    name: "2026 CSE (CORE/CS/DA/AIML/SW)",
    courseCodes: [
      "CSE1022",
      "ECE1002",
      "ECE1003",
      "PHY1008",
      "CHY1009",
      "MAT1002",
      "LIB1023",
      "ENG1002",
      "ENG2001"
    ]
  },
  {
    id: "2026-ece",
    name: "2026 ECE (CORE/ES/VLSI/ECM/EEE)",
    courseCodes: [
      "CSE1022",
      "ECE1003",
      "CHY1009",
      "MAT1002",
      "LIB1023",
      "ENG1002",
      "ENG2001",
      "ECE2001"
    ]
  },
  {
    id: "2026-mtech",
    name: "2026 Int. M.Tech (MIC/MIS)",
    courseCodes: [
      "ECE1006",
      "ENG2004",
      "ENG1006",
      "LIB1023",
      "MAT1009",
      "MAT1014",
      "CHY1008",
      "SWE2005"
    ]
  },
  {
    id: "2026-mech",
    name: "2026 MECH (Core/Automotive/Robotics)",
    courseCodes: [
      "CSE1022",
      "MEC1008",
      "CHY1009",
      "MAT1002",
      "LIB1023",
      "ENG1002",
      "ENG2001"
    ]
  },
  {
    id: "2026-bio",
    name: "2026 Bioscience and Technology",
    courseCodes: [
      "CSE1022",
      "BBT1002",
      "CHY1010",
      "MAT1023",
      "LIB1023",
      "ENG1002",
      "ENG2001"
    ]
  },
  {
    id: "26bcb",
    name: "26BCB",
    courseCodes: [
      "CSE2014",
      "ECE2012",
      "ENG1009",
      "HUM1001",
      "LIB1009",
      "MAT1017",
      "MAT2010"
    ]
  }
];
