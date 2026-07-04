export interface CourseBasket {
  id: string;
  name: string;
  courseCodes: string[];
}

export const COURSE_BASKETS: CourseBasket[] = [
  {
    id: "25bce-cse-core",
    name: "25BCE CSE CORE",
    courseCodes: [
      "MGT1040",
      "STS2010",
      "CSE2001",
      "MAT1003",
      "CSE3002",
      "ECE2002",
      "ECS2003"
    ]
  },
  {
    id: "25bca",
    name: "25BCA",
    courseCodes: [] // To be filled by the user later
  }
];
