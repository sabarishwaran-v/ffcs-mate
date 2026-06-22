export type SlotType = "ELA" | "ETH";

export type SlotEntry = {
  slot: string;
  venue: string;
  type: SlotType;
};

export type TeacherMap = {
  [teacher: string]: {
    ELA: SlotEntry[];
    ETH: SlotEntry[];
  };
};
