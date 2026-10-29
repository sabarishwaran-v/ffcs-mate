const fs = require('fs');

// Raw lines extracted from the 21 pages of the Winter Semester List of Courses & Slots
const rawData = `
BBT1002 Biochemistry ETH D1+TD1
BBT1002 Biochemistry ETH D1+TDD1
BBT1002 Biochemistry ETH D2+TD2
BBT1002 Biochemistry ELA L21+L22
BBT1002 Biochemistry ELA L31+L32
BBT1002 Biochemistry ELA L39+L40
BBT1002 Biochemistry ELA L47+L48
BBT1002 Biochemistry ELA L49+L50
BBT1002 Biochemistry ELA L9+L10
CHY1008 Basic Chemistry and Environmental Studies ETH D1+TD1
CHY1008 Basic Chemistry and Environmental Studies ETH D1+TD1
CHY1008 Basic Chemistry and Environmental Studies ETH D1+TDD1
CHY1008 Basic Chemistry and Environmental Studies ETH D2+TD2
CHY1008 Basic Chemistry and Environmental Studies ETH D2+TD2
CHY1008 Basic Chemistry and Environmental Studies ETH D2+TDD2
CHY1008 Basic Chemistry and Environmental Studies ETH E1+TE1
CHY1008 Basic Chemistry and Environmental Studies ETH E1+TE1
CHY1008 Basic Chemistry and Environmental Studies ETH E2+TE2
CHY1008 Basic Chemistry and Environmental Studies ETH E2+TE2
CHY1008 Basic Chemistry and Environmental Studies ELA L1+L2
CHY1008 Basic Chemistry and Environmental Studies ELA L11+L12
CHY1008 Basic Chemistry and Environmental Studies ELA L17+L18
CHY1008 Basic Chemistry and Environmental Studies ELA L21+L22
CHY1008 Basic Chemistry and Environmental Studies ELA L27+L28
CHY1008 Basic Chemistry and Environmental Studies ELA L3+L4
CHY1008 Basic Chemistry and Environmental Studies ELA L31+L32
CHY1008 Basic Chemistry and Environmental Studies ELA L33+L34
CHY1008 Basic Chemistry and Environmental Studies ELA L41+L42
CHY1008 Basic Chemistry and Environmental Studies ELA L43+L44
CHY1008 Basic Chemistry and Environmental Studies ELA L49+L50
CHY1008 Basic Chemistry and Environmental Studies ELA L51+L52
CHY1009 Chemistry and Environmental Studies ETH C1+TC1
CHY1009 Chemistry and Environmental Studies ETH C1+TC1
CHY1009 Chemistry and Environmental Studies ETH C1+TC1
CHY1009 Chemistry and Environmental Studies ETH C1+TC1
CHY1009 Chemistry and Environmental Studies ETH C1+TC1
CHY1009 Chemistry and Environmental Studies ETH C1+TCC1
CHY1009 Chemistry and Environmental Studies ETH C1+TCC1
CHY1009 Chemistry and Environmental Studies ETH C2+TC2
CHY1009 Chemistry and Environmental Studies ETH C2+TC2
CHY1009 Chemistry and Environmental Studies ETH C2+TC2
CHY1009 Chemistry and Environmental Studies ETH C2+TC2
CHY1009 Chemistry and Environmental Studies ETH C2+TCC2
CHY1009 Chemistry and Environmental Studies ETH C2+TCC2
CHY1009 Chemistry and Environmental Studies ETH D1+TD1
CHY1009 Chemistry and Environmental Studies ETH D1+TD1
CHY1009 Chemistry and Environmental Studies ETH D1+TD1
CHY1009 Chemistry and Environmental Studies ETH D1+TD1
CHY1009 Chemistry and Environmental Studies ETH D1+TDD1
CHY1009 Chemistry and Environmental Studies ETH D1+TDD1
CHY1009 Chemistry and Environmental Studies ETH D2+TD2
CHY1009 Chemistry and Environmental Studies ETH D2+TD2
CHY1009 Chemistry and Environmental Studies ETH D2+TD2
CHY1009 Chemistry and Environmental Studies ETH D2+TD2
CHY1009 Chemistry and Environmental Studies ETH D2+TD2
CHY1009 Chemistry and Environmental Studies ETH D2+TDD2
CHY1009 Chemistry and Environmental Studies ETH D2+TDD2
CHY1009 Chemistry and Environmental Studies ELA L1+L2
CHY1009 Chemistry and Environmental Studies ELA L11+L12
CHY1009 Chemistry and Environmental Studies ELA L13+L14
CHY1009 Chemistry and Environmental Studies ELA L15+L16
CHY1009 Chemistry and Environmental Studies ELA L15+L16
CHY1009 Chemistry and Environmental Studies ELA L17+L18
CHY1009 Chemistry and Environmental Studies ELA L19+L20
CHY1009 Chemistry and Environmental Studies ELA L21+L22
CHY1009 Chemistry and Environmental Studies ELA L23+L24
CHY1009 Chemistry and Environmental Studies ELA L25+L26
CHY1009 Chemistry and Environmental Studies ELA L27+L28
CHY1009 Chemistry and Environmental Studies ELA L29+L30
CHY1009 Chemistry and Environmental Studies ELA L3+L4
CHY1009 Chemistry and Environmental Studies ELA L33+L34
CHY1009 Chemistry and Environmental Studies ELA L35+L36
CHY1009 Chemistry and Environmental Studies ELA L37+L38
CHY1009 Chemistry and Environmental Studies ELA L39+L40
CHY1009 Chemistry and Environmental Studies ELA L41+L42
CHY1009 Chemistry and Environmental Studies ELA L43+L44
CHY1009 Chemistry and Environmental Studies ELA L47+L48
CHY1009 Chemistry and Environmental Studies ELA L47+L48
CHY1009 Chemistry and Environmental Studies ELA L49+L50
CHY1009 Chemistry and Environmental Studies ELA L5+L6
CHY1009 Chemistry and Environmental Studies ELA L53+L54
CHY1009 Chemistry and Environmental Studies ELA L57+L58
CHY1009 Chemistry and Environmental Studies ELA L57+L58
CHY1009 Chemistry and Environmental Studies ELA L7+L8
CHY1009 Chemistry and Environmental Studies ELA L9+L10
CHY1010 Organic Chemistry and Environmental Studies ETH C1+TC1
CHY1010 Organic Chemistry and Environmental Studies ETH C1+TCC1
CHY1010 Organic Chemistry and Environmental Studies ETH C2+TC2
CHY1010 Organic Chemistry and Environmental Studies ELA L45+L46
CHY1010 Organic Chemistry and Environmental Studies ELA L5+L6
CHY1010 Organic Chemistry and Environmental Studies ELA L53+L54
CSE1022 Introduction to Programming ETH A1+TA1
CSE1022 Introduction to Programming ETH A1+TA1
CSE1022 Introduction to Programming ETH A1+TA1
CSE1022 Introduction to Programming ETH A1+TA1
CSE1022 Introduction to Programming ETH A1+TA1
CSE1022 Introduction to Programming ETH A1+TA1
CSE1022 Introduction to Programming ETH A1+TA1
CSE1022 Introduction to Programming ETH A1+TA1
CSE1022 Introduction to Programming ETH A1+TA1
CSE1022 Introduction to Programming ETH A1+TA1
CSE1022 Introduction to Programming ETH A1+TA1
CSE1022 Introduction to Programming ETH A1+TA1
CSE1022 Introduction to Programming ETH A1+TA1
CSE1022 Introduction to Programming ETH A1+TA1
CSE1022 Introduction to Programming ETH A1+TA1
CSE1022 Introduction to Programming ETH A1+TA1
CSE1022 Introduction to Programming ETH A1+TA1
CSE1022 Introduction to Programming ETH A1+TA1
CSE1022 Introduction to Programming ETH A2+TA2
CSE1022 Introduction to Programming ETH A2+TA2
CSE1022 Introduction to Programming ETH A2+TA2
CSE1022 Introduction to Programming ETH A2+TA2
CSE1022 Introduction to Programming ETH A2+TA2
CSE1022 Introduction to Programming ETH A2+TA2
CSE1022 Introduction to Programming ETH A2+TA2
CSE1022 Introduction to Programming ETH A2+TA2
CSE1022 Introduction to Programming ETH A2+TA2
CSE1022 Introduction to Programming ETH A2+TA2
CSE1022 Introduction to Programming ETH A2+TA2
CSE1022 Introduction to Programming ETH A2+TA2
CSE1022 Introduction to Programming ETH A2+TA2
CSE1022 Introduction to Programming ETH A2+TA2
CSE1022 Introduction to Programming ETH A2+TA2
CSE1022 Introduction to Programming ETH A2+TA2
CSE1022 Introduction to Programming ETH A2+TA2
CSE1022 Introduction to Programming ETH B1+TB1
CSE1022 Introduction to Programming ETH B1+TB1
CSE1022 Introduction to Programming ETH B1+TB1
CSE1022 Introduction to Programming ETH B1+TB1
CSE1022 Introduction to Programming ETH B1+TB1
CSE1022 Introduction to Programming ETH B1+TB1
CSE1022 Introduction to Programming ETH B1+TB1
CSE1022 Introduction to Programming ETH B1+TB1
CSE1022 Introduction to Programming ETH B1+TB1
CSE1022 Introduction to Programming ETH B1+TB1
CSE1022 Introduction to Programming ETH B1+TB1
CSE1022 Introduction to Programming ETH B1+TB1
CSE1022 Introduction to Programming ETH B1+TB1
CSE1022 Introduction to Programming ETH B1+TB1
CSE1022 Introduction to Programming ETH B1+TB1
CSE1022 Introduction to Programming ETH B1+TB1
CSE1022 Introduction to Programming ETH B1+TB1
CSE1022 Introduction to Programming ETH B2+TB2
CSE1022 Introduction to Programming ETH B2+TB2
CSE1022 Introduction to Programming ETH B2+TB2
CSE1022 Introduction to Programming ETH B2+TB2
CSE1022 Introduction to Programming ETH B2+TB2
CSE1022 Introduction to Programming ETH B2+TB2
CSE1022 Introduction to Programming ETH B2+TB2
CSE1022 Introduction to Programming ETH B2+TB2
CSE1022 Introduction to Programming ETH B2+TB2
CSE1022 Introduction to Programming ETH B2+TB2
CSE1022 Introduction to Programming ETH B2+TB2
CSE1022 Introduction to Programming ETH B2+TB2
CSE1022 Introduction to Programming ETH B2+TB2
CSE1022 Introduction to Programming ETH B2+TB2
CSE1022 Introduction to Programming ETH B2+TB2
CSE1022 Introduction to Programming ETH B2+TB2
CSE1022 Introduction to Programming ETH B2+TB2
CSE1022 Introduction to Programming ETH B2+TB2
CSE1022 Introduction to Programming ETH E1+TE1
CSE1022 Introduction to Programming ETH E1+TE1
CSE1022 Introduction to Programming ETH E1+TE1
CSE1022 Introduction to Programming ETH E1+TE1
CSE1022 Introduction to Programming ETH E1+TE1
CSE1022 Introduction to Programming ETH E1+TE1
CSE1022 Introduction to Programming ETH E1+TE1
CSE1022 Introduction to Programming ETH E1+TE1
CSE1022 Introduction to Programming ETH E1+TE1
CSE1022 Introduction to Programming ETH E1+TE1
CSE1022 Introduction to Programming ETH E1+TE1
CSE1022 Introduction to Programming ETH E1+TE1
CSE1022 Introduction to Programming ETH E2+TE2
CSE1022 Introduction to Programming ETH E2+TE2
CSE1022 Introduction to Programming ETH E2+TE2
CSE1022 Introduction to Programming ETH E2+TE2
CSE1022 Introduction to Programming ETH E2+TE2
CSE1022 Introduction to Programming ETH E2+TE2
CSE1022 Introduction to Programming ETH E2+TE2
CSE1022 Introduction to Programming ETH E2+TE2
CSE1022 Introduction to Programming ETH E2+TE2
CSE1022 Introduction to Programming ETH E2+TE2
CSE1022 Introduction to Programming ETH E2+TE2
CSE1022 Introduction to Programming ELA L1+L2
CSE1022 Introduction to Programming ELA L1+L2
CSE1022 Introduction to Programming ELA L1+L2
CSE1022 Introduction to Programming ELA L11+L12
CSE1022 Introduction to Programming ELA L11+L12
CSE1022 Introduction to Programming ELA L11+L12
CSE1022 Introduction to Programming ELA L11+L12
CSE1022 Introduction to Programming ELA L13+L14
CSE1022 Introduction to Programming ELA L13+L14
CSE1022 Introduction to Programming ELA L13+L14
CSE1022 Introduction to Programming ELA L13+L14
CSE1022 Introduction to Programming ELA L15+L16
CSE1022 Introduction to Programming ELA L15+L16
CSE1022 Introduction to Programming ELA L15+L16
CSE1022 Introduction to Programming ELA L15+L16
CSE1022 Introduction to Programming ELA L15+L16
CSE1022 Introduction to Programming ELA L17+L18
CSE1022 Introduction to Programming ELA L17+L18
CSE1022 Introduction to Programming ELA L17+L18
CSE1022 Introduction to Programming ELA L17+L18
CSE1022 Introduction to Programming ELA L19+L20
CSE1022 Introduction to Programming ELA L19+L20
CSE1022 Introduction to Programming ELA L19+L20
CSE1022 Introduction to Programming ELA L21+L22
CSE1022 Introduction to Programming ELA L21+L22
CSE1022 Introduction to Programming ELA L21+L22
CSE1022 Introduction to Programming ELA L21+L22
CSE1022 Introduction to Programming ELA L23+L24
CSE1022 Introduction to Programming ELA L23+L24
CSE1022 Introduction to Programming ELA L23+L24
CSE1022 Introduction to Programming ELA L23+L24
CSE1022 Introduction to Programming ELA L25+L26
CSE1022 Introduction to Programming ELA L25+L26
CSE1022 Introduction to Programming ELA L25+L26
CSE1022 Introduction to Programming ELA L25+L26
CSE1022 Introduction to Programming ELA L27+L28
CSE1022 Introduction to Programming ELA L27+L28
CSE1022 Introduction to Programming ELA L27+L28
CSE1022 Introduction to Programming ELA L27+L28
CSE1022 Introduction to Programming ELA L29+L30
CSE1022 Introduction to Programming ELA L29+L30
CSE1022 Introduction to Programming ELA L29+L30
CSE1022 Introduction to Programming ELA L29+L30
CSE1022 Introduction to Programming ELA L3+L4
CSE1022 Introduction to Programming ELA L3+L4
CSE1022 Introduction to Programming ELA L3+L4
CSE1022 Introduction to Programming ELA L3+L4
CSE1022 Introduction to Programming ELA L31+L32
CSE1022 Introduction to Programming ELA L31+L32
CSE1022 Introduction to Programming ELA L31+L32
CSE1022 Introduction to Programming ELA L31+L32
CSE1022 Introduction to Programming ELA L33+L34
CSE1022 Introduction to Programming ELA L33+L34
CSE1022 Introduction to Programming ELA L33+L34
CSE1022 Introduction to Programming ELA L33+L34
CSE1022 Introduction to Programming ELA L35+L36
CSE1022 Introduction to Programming ELA L35+L36
CSE1022 Introduction to Programming ELA L35+L36
CSE1022 Introduction to Programming ELA L35+L36
CSE1022 Introduction to Programming ELA L37+L38
CSE1022 Introduction to Programming ELA L37+L38
CSE1022 Introduction to Programming ELA L37+L38
CSE1022 Introduction to Programming ELA L37+L38
CSE1022 Introduction to Programming ELA L37+L38
CSE1022 Introduction to Programming ELA L39+L40
CSE1022 Introduction to Programming ELA L39+L40
CSE1022 Introduction to Programming ELA L39+L40
CSE1022 Introduction to Programming ELA L39+L40
CSE1022 Introduction to Programming ELA L41+L42
CSE1022 Introduction to Programming ELA L41+L42
CSE1022 Introduction to Programming ELA L41+L42
CSE1022 Introduction to Programming ELA L41+L42
CSE1022 Introduction to Programming ELA L43+L44
CSE1022 Introduction to Programming ELA L43+L44
CSE1022 Introduction to Programming ELA L43+L44
CSE1022 Introduction to Programming ELA L43+L44
CSE1022 Introduction to Programming ELA L45+L46
CSE1022 Introduction to Programming ELA L45+L46
CSE1022 Introduction to Programming ELA L45+L46
CSE1022 Introduction to Programming ELA L45+L46
CSE1022 Introduction to Programming ELA L47+L48
CSE1022 Introduction to Programming ELA L47+L48
CSE1022 Introduction to Programming ELA L47+L48
CSE1022 Introduction to Programming ELA L49+L50
CSE1022 Introduction to Programming ELA L49+L50
CSE1022 Introduction to Programming ELA L49+L50
CSE1022 Introduction to Programming ELA L49+L50
CSE1022 Introduction to Programming ELA L5+L6
CSE1022 Introduction to Programming ELA L5+L6
CSE1022 Introduction to Programming ELA L5+L6
CSE1022 Introduction to Programming ELA L5+L6
CSE1022 Introduction to Programming ELA L51+L52
CSE1022 Introduction to Programming ELA L51+L52
CSE1022 Introduction to Programming ELA L51+L52
CSE1022 Introduction to Programming ELA L51+L52
CSE1022 Introduction to Programming ELA L53+L54
CSE1022 Introduction to Programming ELA L53+L54
CSE1022 Introduction to Programming ELA L53+L54
CSE1022 Introduction to Programming ELA L53+L54
CSE1022 Introduction to Programming ELA L55+L56
CSE1022 Introduction to Programming ELA L55+L56
CSE1022 Introduction to Programming ELA L55+L56
CSE1022 Introduction to Programming ELA L55+L56
CSE1022 Introduction to Programming ELA L57+L58
CSE1022 Introduction to Programming ELA L57+L58
CSE1022 Introduction to Programming ELA L57+L58
CSE1022 Introduction to Programming ELA L57+L58
CSE1022 Introduction to Programming ELA L7+L8
CSE1022 Introduction to Programming ELA L7+L8
CSE1022 Introduction to Programming ELA L7+L8
CSE1022 Introduction to Programming ELA L7+L8
CSE1022 Introduction to Programming ELA L9+L10
CSE1022 Introduction to Programming ELA L9+L10
CSE1022 Introduction to Programming ELA L9+L10
CSE2014 Data Structures and Algorithms ETH A1+TA1+TAA1
CSE2014 Data Structures and Algorithms ETH A2+TA2+TAA2
CSE2014 Data Structures and Algorithms ETH B2+TB2+TBB2
CSE2014 Data Structures and Algorithms ELA L23+L24
CSE2014 Data Structures and Algorithms ELA L3+L4
CSE2014 Data Structures and Algorithms ELA L43+L44
CSE2014 Data Structures and Algorithms EPJ NIL
CSE2014 Data Structures and Algorithms EPJ NIL
CSE2014 Data Structures and Algorithms EPJ NIL
ECE1002 Fundamentals of Electrical and Electronics Engineering ETH C1+TC1
ECE1002 Fundamentals of Electrical and Electronics Engineering ETH C1+TC1
ECE1002 Fundamentals of Electrical and Electronics Engineering ETH C1+TC1
ECE1002 Fundamentals of Electrical and Electronics Engineering ETH C1+TC1
ECE1002 Fundamentals of Electrical and Electronics Engineering ETH C1+TC1
ECE1002 Fundamentals of Electrical and Electronics Engineering ETH C1+TC1
ECE1002 Fundamentals of Electrical and Electronics Engineering ETH C1+TC1
ECE1002 Fundamentals of Electrical and Electronics Engineering ETH C1+TC1
ECE1002 Fundamentals of Electrical and Electronics Engineering ETH C1+TC1
ECE1002 Fundamentals of Electrical and Electronics Engineering ETH C1+TCC1
ECE1002 Fundamentals of Electrical and Electronics Engineering ETH C1+TCC1
ECE1002 Fundamentals of Electrical and Electronics Engineering ETH C2+TC2
ECE1002 Fundamentals of Electrical and Electronics Engineering ETH C2+TC2
ECE1002 Fundamentals of Electrical and Electronics Engineering ETH C2+TC2
ECE1002 Fundamentals of Electrical and Electronics Engineering ETH C2+TC2
ECE1002 Fundamentals of Electrical and Electronics Engineering ETH C2+TC2
ECE1002 Fundamentals of Electrical and Electronics Engineering ETH C2+TC2
ECE1002 Fundamentals of Electrical and Electronics Engineering ETH C2+TC2
ECE1002 Fundamentals of Electrical and Electronics Engineering ETH C2+TC2
ECE1002 Fundamentals of Electrical and Electronics Engineering ETH C2+TC2
ECE1002 Fundamentals of Electrical and Electronics Engineering ETH C2+TCC2
ECE1002 Fundamentals of Electrical and Electronics Engineering ETH C2+TCC2
ECE1002 Fundamentals of Electrical and Electronics Engineering ETH D1+TD1
ECE1002 Fundamentals of Electrical and Electronics Engineering ETH D1+TD1
ECE1002 Fundamentals of Electrical and Electronics Engineering ETH D1+TD1
ECE1002 Fundamentals of Electrical and Electronics Engineering ETH D1+TD1
ECE1002 Fundamentals of Electrical and Electronics Engineering ETH D1+TD1
ECE1002 Fundamentals of Electrical and Electronics Engineering ETH D1+TD1
ECE1002 Fundamentals of Electrical and Electronics Engineering ETH D1+TD1
ECE1002 Fundamentals of Electrical and Electronics Engineering ETH D1+TD1
ECE1002 Fundamentals of Electrical and Electronics Engineering ETH D1+TD1
ECE1002 Fundamentals of Electrical and Electronics Engineering ETH D1+TDD1
ECE1002 Fundamentals of Electrical and Electronics Engineering ETH D1+TDD1
ECE1002 Fundamentals of Electrical and Electronics Engineering ETH D2+TD2
ECE1002 Fundamentals of Electrical and Electronics Engineering ETH D2+TD2
ECE1002 Fundamentals of Electrical and Electronics Engineering ETH D2+TD2
ECE1002 Fundamentals of Electrical and Electronics Engineering ETH D2+TD2
ECE1002 Fundamentals of Electrical and Electronics Engineering ETH D2+TD2
ECE1002 Fundamentals of Electrical and Electronics Engineering ETH D2+TD2
ECE1002 Fundamentals of Electrical and Electronics Engineering ETH D2+TD2
ECE1002 Fundamentals of Electrical and Electronics Engineering ETH D2+TD2
ECE1002 Fundamentals of Electrical and Electronics Engineering ETH D2+TDD2
ECE1002 Fundamentals of Electrical and Electronics Engineering ETH D2+TDD2
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L1+L2
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L11+L12
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L13+L14
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L15+L16
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L15+L16
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L17+L18
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L19+L20
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L21+L22
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L21+L22
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L23+L24
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L23+L24
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L25+L26
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L27+L28
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L27+L28
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L29+L30
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L29+L30
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L3+L4
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L3+L4
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L31+L32
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L31+L32
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L33+L34
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L33+L34
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L35+L36
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L37+L38
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L37+L38
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L39+L40
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L39+L40
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L41+L42
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L43+L44
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L43+L44
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L45+L46
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L45+L46
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L47+L48
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L49+L50
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L49+L50
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L5+L6
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L5+L6
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L51+L52
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L51+L52
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L53+L54
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L55+L56
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L55+L56
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L57+L58
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L7+L8
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L9+L10
ECE1002 Fundamentals of Electrical and Electronics Engineering ELA L9+L10
ECE1003 Digital Logic Design ETH C1+TC1
ECE1003 Digital Logic Design ETH C1+TC1
ECE1003 Digital Logic Design ETH C1+TC1
ECE1003 Digital Logic Design ETH C2+TC2
ECE1003 Digital Logic Design ETH C2+TC2
ECE1003 Digital Logic Design ETH C2+TC2
ECE1003 Digital Logic Design ETH D1+TD1
ECE1003 Digital Logic Design ETH D1+TD1
ECE1003 Digital Logic Design ETH D1+TDD1
ECE1003 Digital Logic Design ETH D2+TD2
ECE1003 Digital Logic Design ETH D2+TD2
ECE1003 Digital Logic Design ETH D2+TDD2
ECE1003 Digital Logic Design ELA L1+L2
ECE1003 Digital Logic Design ELA L11+L12
ECE1003 Digital Logic Design ELA L17+L18
ECE1003 Digital Logic Design ELA L23+L24
ECE1003 Digital Logic Design ELA L29+L30
ECE1003 Digital Logic Design ELA L31+L32
ECE1003 Digital Logic Design ELA L37+L38
ECE1003 Digital Logic Design ELA L39+L40
ECE1003 Digital Logic Design ELA L41+L42
ECE1003 Digital Logic Design ELA L45+L46
ECE1003 Digital Logic Design ELA L51+L52
ECE1003 Digital Logic Design ELA L57+L58
ECE1003 Digital Logic Design ELA L9+L10
ECE1006 Digital Logic and Microprocessors ETH B1+TB1
ECE1006 Digital Logic and Microprocessors ETH B1+TB1
ECE1006 Digital Logic and Microprocessors ETH B1+TB1
ECE1006 Digital Logic and Microprocessors ETH B2+TB2
ECE1006 Digital Logic and Microprocessors ETH B2+TB2
ECE1006 Digital Logic and Microprocessors ETH B2+TB2
ECE1006 Digital Logic and Microprocessors ETH C1+TC1
ECE1006 Digital Logic and Microprocessors ETH C1+TCC1
ECE1006 Digital Logic and Microprocessors ETH C2+TC2
ECE1006 Digital Logic and Microprocessors ETH C2+TCC2
ECE1006 Digital Logic and Microprocessors ELA L13+L14
ECE1006 Digital Logic and Microprocessors ELA L15+L16
ECE1006 Digital Logic and Microprocessors ELA L21+L22
ECE1006 Digital Logic and Microprocessors ELA L29+L30
ECE1006 Digital Logic and Microprocessors ELA L31+L32
ECE1006 Digital Logic and Microprocessors ELA L37+L38
ECE1006 Digital Logic and Microprocessors ELA L45+L46
ECE1006 Digital Logic and Microprocessors ELA L5+L6
ECE1006 Digital Logic and Microprocessors ELA L51+L52
ECE1006 Digital Logic and Microprocessors ELA L53+L54
ECE1006 Digital Logic and Microprocessors ELA L55+L56
ECE1006 Digital Logic and Microprocessors ELA L9+L10
ECE2001 Analog Devices and Circuits ETH E1+TE1
ECE2001 Analog Devices and Circuits ETH E1+TE1
ECE2001 Analog Devices and Circuits ETH E1+TE1
ECE2001 Analog Devices and Circuits ETH E2+TE2
ECE2001 Analog Devices and Circuits ETH E2+TE2
ECE2001 Analog Devices and Circuits ETH E2+TE2
ECE2001 Analog Devices and Circuits ETH E2+TE2
ECE2001 Analog Devices and Circuits ETH F1+TF1
ECE2001 Analog Devices and Circuits ETH F1+TFF1
ECE2001 Analog Devices and Circuits ETH F2+TF2
ECE2001 Analog Devices and Circuits ETH F2+TFF2
ECE2001 Analog Devices and Circuits ELA L1+L2
ECE2001 Analog Devices and Circuits ELA L15+L16
ECE2001 Analog Devices and Circuits ELA L27+L28
ECE2001 Analog Devices and Circuits ELA L29+L30
ECE2001 Analog Devices and Circuits ELA L3+L4
ECE2001 Analog Devices and Circuits ELA L33+L34
ECE2001 Analog Devices and Circuits ELA L39+L40
ECE2001 Analog Devices and Circuits ELA L45+L46
ECE2001 Analog Devices and Circuits ELA L47+L48
ECE2001 Analog Devices and Circuits ELA L49+L50
ECE2001 Analog Devices and Circuits ELA L5+L6
ECE2001 Analog Devices and Circuits ELA L57+L58
ECE2012 Principles of Electronics Engineering ETH C1
ECE2012 Principles of Electronics Engineering ETH C2
ECE2012 Principles of Electronics Engineering ETH D2
ECE2012 Principles of Electronics Engineering ELA L11+L12
ECE2012 Principles of Electronics Engineering ELA L17+L18
ECE2012 Principles of Electronics Engineering ELA L57+L58
ENG1002 English for Effective Communication ETH D1
ENG1002 English for Effective Communication ETH D1
ENG1002 English for Effective Communication ETH D1
ENG1002 English for Effective Communication ETH D1
ENG1002 English for Effective Communication ETH D1
ENG1002 English for Effective Communication ETH D1
ENG1002 English for Effective Communication ETH D1
ENG1002 English for Effective Communication ETH D2
ENG1002 English for Effective Communication ETH D2
ENG1002 English for Effective Communication ETH D2
ENG1002 English for Effective Communication ETH D2
ENG1002 English for Effective Communication ETH D2
ENG1002 English for Effective Communication ETH D2
ENG1002 English for Effective Communication ETH D2
ENG1002 English for Effective Communication ETH F1
ENG1002 English for Effective Communication ETH F1
ENG1002 English for Effective Communication ETH F1
ENG1002 English for Effective Communication ETH F1
ENG1002 English for Effective Communication ETH F1
ENG1002 English for Effective Communication ETH F1
ENG1002 English for Effective Communication ETH F1
ENG1002 English for Effective Communication ETH F2
ENG1002 English for Effective Communication ETH F2
ENG1002 English for Effective Communication ETH F2
ENG1002 English for Effective Communication ETH F2
ENG1002 English for Effective Communication ETH F2
ENG1002 English for Effective Communication ETH F2
ENG1002 English for Effective Communication ETH F2
ENG1002 English for Effective Communication ETH G1
ENG1002 English for Effective Communication ETH G1
ENG1002 English for Effective Communication ETH G1
ENG1002 English for Effective Communication ETH G1
ENG1002 English for Effective Communication ETH G1
ENG1002 English for Effective Communication ETH G1
ENG1002 English for Effective Communication ETH G1
ENG1002 English for Effective Communication ETH G2
ENG1002 English for Effective Communication ETH G2
ENG1002 English for Effective Communication ETH G2
ENG1002 English for Effective Communication ETH G2
ENG1002 English for Effective Communication ETH G2
ENG1002 English for Effective Communication ETH G2
ENG1002 English for Effective Communication ETH G2
ENG1002 English for Effective Communication ELA L1+L2
ENG1002 English for Effective Communication ELA L11+L12
ENG1002 English for Effective Communication ELA L13+L14
ENG1002 English for Effective Communication ELA L13+L14
ENG1002 English for Effective Communication ELA L15+L16
ENG1002 English for Effective Communication ELA L15+L16
ENG1002 English for Effective Communication ELA L19+L20
ENG1002 English for Effective Communication ELA L19+L20
ENG1002 English for Effective Communication ELA L21+L22
ENG1002 English for Effective Communication ELA L23+L24
ENG1002 English for Effective Communication ELA L25+L26
ENG1002 English for Effective Communication ELA L25+L26
ENG1002 English for Effective Communication ELA L27+L28
ENG1002 English for Effective Communication ELA L27+L28
ENG1002 English for Effective Communication ELA L29+L30
ENG1002 English for Effective Communication ELA L29+L30
ENG1002 English for Effective Communication ELA L3+L4
ENG1002 English for Effective Communication ELA L3+L4
ENG1002 English for Effective Communication ELA L31+L32
ENG1002 English for Effective Communication ELA L33+L34
ENG1002 English for Effective Communication ELA L33+L34
ENG1002 English for Effective Communication ELA L35+L36
ENG1002 English for Effective Communication ELA L35+L36
ENG1002 English for Effective Communication ELA L37+L38
ENG1002 English for Effective Communication ELA L37+L38
ENG1002 English for Effective Communication ELA L39+L40
ENG1002 English for Effective Communication ELA L41+L42
ENG1002 English for Effective Communication ELA L41+L42
ENG1002 English for Effective Communication ELA L43+L44
ENG1002 English for Effective Communication ELA L43+L44
ENG1002 English for Effective Communication ELA L45+L46
ENG1002 English for Effective Communication ELA L45+L46
ENG1002 English for Effective Communication ELA L47+L48
ENG1002 English for Effective Communication ELA L47+L48
ENG1002 English for Effective Communication ELA L49+L50
ENG1002 English for Effective Communication ELA L5+L6
ENG1002 English for Effective Communication ELA L5+L6
ENG1002 English for Effective Communication ELA L51+L52
ENG1002 English for Effective Communication ELA L51+L52
ENG1002 English for Effective Communication ELA L53+L54
ENG1002 English for Effective Communication ELA L55+L56
ENG1002 English for Effective Communication ELA L55+L56
ENG1002 English for Effective Communication ELA L57+L58
ENG1002 English for Effective Communication ELA L7+L8
ENG1002 English for Effective Communication ELA L7+L8
ENG1002 English for Effective Communication ELA L9+L10
ENG1006 Functional Communication in English ETH F1
ENG1006 Functional Communication in English ETH F1
ENG1006 Functional Communication in English ETH F1
ENG1006 Functional Communication in English ETH F2
ENG1006 Functional Communication in English ETH G1
ENG1006 Functional Communication in English ETH G1
ENG1006 Functional Communication in English ETH G2
ENG1006 Functional Communication in English ETH G2
ENG1006 Functional Communication in English ELA L11+L12
ENG1006 Functional Communication in English ELA L15+L16
ENG1006 Functional Communication in English ELA L35+L36
ENG1006 Functional Communication in English ELA L45+L46
ENG1006 Functional Communication in English ELA L49+L50
ENG1006 Functional Communication in English ELA L55+L56
ENG1006 Functional Communication in English ELA L57+L58
ENG1006 Functional Communication in English ELA L7+L8
ENG1009 Business Communication and Value Science - II TH D1
ENG1009 Business Communication and Value Science - II TH D2
ENG1009 Business Communication and Value Science - II TH F2
ENG2001 English for Professional Communication ETH D1
ENG2001 English for Professional Communication ETH D1
ENG2001 English for Professional Communication ETH D1
ENG2001 English for Professional Communication ETH D1
ENG2001 English for Professional Communication ETH D2
ENG2001 English for Professional Communication ETH D2
ENG2001 English for Professional Communication ETH D2
ENG2001 English for Professional Communication ETH D2
ENG2001 English for Professional Communication ETH E1
ENG2001 English for Professional Communication ETH E1
ENG2001 English for Professional Communication ETH E1
ENG2001 English for Professional Communication ETH E1
ENG2001 English for Professional Communication ETH E1
ENG2001 English for Professional Communication ETH E2
ENG2001 English for Professional Communication ETH E2
ENG2001 English for Professional Communication ETH E2
ENG2001 English for Professional Communication ETH E2
ENG2001 English for Professional Communication ETH E2
ENG2001 English for Professional Communication ETH G1
ENG2001 English for Professional Communication ETH G1
ENG2001 English for Professional Communication ETH G1
ENG2001 English for Professional Communication ETH G1
ENG2001 English for Professional Communication ETH G1
ENG2001 English for Professional Communication ETH G2
ENG2001 English for Professional Communication ETH G2
ENG2001 English for Professional Communication ETH G2
ENG2001 English for Professional Communication ETH G2
ENG2001 English for Professional Communication ELA L1+L2
ENG2001 English for Professional Communication ELA L11+L12
ENG2001 English for Professional Communication ELA L13+L14
ENG2001 English for Professional Communication ELA L15+L16
ENG2001 English for Professional Communication ELA L19+L20
ENG2001 English for Professional Communication ELA L21+L22
ENG2001 English for Professional Communication ELA L23+L24
ENG2001 English for Professional Communication ELA L25+L26
ENG2001 English for Professional Communication ELA L27+L28
ENG2001 English for Professional Communication ELA L29+L30
ENG2001 English for Professional Communication ELA L3+L4
ENG2001 English for Professional Communication ELA L31+L32
ENG2001 English for Professional Communication ELA L31+L32
ENG2001 English for Professional Communication ELA L33+L34
ENG2001 English for Professional Communication ELA L35+L36
ENG2001 English for Professional Communication ELA L37+L38
ENG2001 English for Professional Communication ELA L39+L40
ENG2001 English for Professional Communication ELA L41+L42
ENG2001 English for Professional Communication ELA L43+L44
ENG2001 English for Professional Communication ELA L45+L46
ENG2001 English for Professional Communication ELA L47+L48
ENG2001 English for Professional Communication ELA L49+L50
ENG2001 English for Professional Communication ELA L5+L6
ENG2001 English for Professional Communication ELA L51+L52
ENG2001 English for Professional Communication ELA L53+L54
ENG2001 English for Professional Communication ELA L55+L56
ENG2001 English for Professional Communication ELA L57+L58
ENG2001 English for Professional Communication ELA L7+L8
ENG2001 English for Professional Communication ELA L9+L10
ENG2004 Advanced Professional Communication ETH F1
ENG2004 Advanced Professional Communication ETH F2
ENG2004 Advanced Professional Communication ETH G1
ENG2004 Advanced Professional Communication ELA L39+L40
ENG2004 Advanced Professional Communication ELA L43+L44
ENG2004 Advanced Professional Communication ELA L5+L6
HUM1001 Fundamentals of Economics TH C2
HUM1001 Fundamentals of Economics TH F1
HUM1001 Fundamentals of Economics TH F2
LIB1009 Essence of Indian Traditional Knowledge TH TE2
LIB1009 Essence of Indian Traditional Knowledge TH TG1
LIB1009 Essence of Indian Traditional Knowledge TH TG2
LIB1023 Indian Studies LO L11+L12
LIB1023 Indian Studies LO L11+L12
LIB1023 Indian Studies LO L11+L12
LIB1023 Indian Studies LO L13+L14
LIB1023 Indian Studies LO L13+L14
LIB1023 Indian Studies LO L13+L14
LIB1023 Indian Studies LO L15+L16
LIB1023 Indian Studies LO L15+L16
LIB1023 Indian Studies LO L15+L16
LIB1023 Indian Studies LO L17+L18
LIB1023 Indian Studies LO L17+L18
LIB1023 Indian Studies LO L17+L18
LIB1023 Indian Studies LO L19+L20
LIB1023 Indian Studies LO L19+L20
LIB1023 Indian Studies LO L19+L20
LIB1023 Indian Studies LO L21+L22
LIB1023 Indian Studies LO L21+L22
LIB1023 Indian Studies LO L21+L22
LIB1023 Indian Studies LO L23+L24
LIB1023 Indian Studies LO L23+L24
LIB1023 Indian Studies LO L23+L24
LIB1023 Indian Studies LO L23+L24
LIB1023 Indian Studies LO L25+L26
LIB1023 Indian Studies LO L25+L26
LIB1023 Indian Studies LO L25+L26
LIB1023 Indian Studies LO L27+L28
LIB1023 Indian Studies LO L27+L28
LIB1023 Indian Studies LO L27+L28
LIB1023 Indian Studies LO L27+L28
LIB1023 Indian Studies LO L29+L30
LIB1023 Indian Studies LO L29+L30
LIB1023 Indian Studies LO L29+L30
LIB1023 Indian Studies LO L29+L30
LIB1023 Indian Studies LO L3+L4
LIB1023 Indian Studies LO L3+L4
LIB1023 Indian Studies LO L3+L4
LIB1023 Indian Studies LO L31+L32
LIB1023 Indian Studies LO L31+L32
LIB1023 Indian Studies LO L31+L32
LIB1023 Indian Studies LO L33+L34
LIB1023 Indian Studies LO L33+L34
LIB1023 Indian Studies LO L33+L34
LIB1023 Indian Studies LO L35+L36
LIB1023 Indian Studies LO L35+L36
LIB1023 Indian Studies LO L35+L36
LIB1023 Indian Studies LO L37+L38
LIB1023 Indian Studies LO L37+L38
LIB1023 Indian Studies LO L37+L38
LIB1023 Indian Studies LO L37+L38
LIB1023 Indian Studies LO L39+L40
LIB1023 Indian Studies LO L39+L40
LIB1023 Indian Studies LO L39+L40
LIB1023 Indian Studies LO L41+L42
LIB1023 Indian Studies LO L41+L42
LIB1023 Indian Studies LO L41+L42
LIB1023 Indian Studies LO L43+L44
LIB1023 Indian Studies LO L43+L44
LIB1023 Indian Studies LO L43+L44
LIB1023 Indian Studies LO L45+L46
LIB1023 Indian Studies LO L45+L46
LIB1023 Indian Studies LO L45+L46
LIB1023 Indian Studies LO L47+L48
LIB1023 Indian Studies LO L47+L48
LIB1023 Indian Studies LO L47+L48
LIB1023 Indian Studies LO L49+L50
LIB1023 Indian Studies LO L49+L50
LIB1023 Indian Studies LO L49+L50
LIB1023 Indian Studies LO L5+L6
LIB1023 Indian Studies LO L5+L6
LIB1023 Indian Studies LO L5+L6
LIB1023 Indian Studies LO L51+L52
LIB1023 Indian Studies LO L51+L52
LIB1023 Indian Studies LO L51+L52
LIB1023 Indian Studies LO L51+L52
LIB1023 Indian Studies LO L53+L54
LIB1023 Indian Studies LO L53+L54
LIB1023 Indian Studies LO L53+L54
LIB1023 Indian Studies LO L55+L56
LIB1023 Indian Studies LO L55+L56
LIB1023 Indian Studies LO L55+L56
LIB1023 Indian Studies LO L55+L56
LIB1023 Indian Studies LO L57+L58
LIB1023 Indian Studies LO L57+L58
LIB1023 Indian Studies LO L57+L58
LIB1023 Indian Studies LO L7+L8
LIB1023 Indian Studies LO L7+L8
LIB1023 Indian Studies LO L7+L8
LIB1023 Indian Studies LO L9+L10
LIB1023 Indian Studies LO L9+L10
LIB1023 Indian Studies LO L9+L10
MAT1002 Applications of Differential and Difference Equations TH A1+TA1+TAA1
MAT1002 Applications of Differential and Difference Equations TH A1+TA1+TAA1
MAT1002 Applications of Differential and Difference Equations TH A1+TA1+TAA1
MAT1002 Applications of Differential and Difference Equations TH A1+TA1+TAA1
MAT1002 Applications of Differential and Difference Equations TH A1+TA1+TAA1
MAT1002 Applications of Differential and Difference Equations TH A1+TA1+TAA1
MAT1002 Applications of Differential and Difference Equations TH A1+TA1+TAA1
MAT1002 Applications of Differential and Difference Equations TH A1+TA1+TAA1
MAT1002 Applications of Differential and Difference Equations TH A1+TA1+TAA1
MAT1002 Applications of Differential and Difference Equations TH A1+TA1+TAA1
MAT1002 Applications of Differential and Difference Equations TH A1+TA1+TAA1
MAT1002 Applications of Differential and Difference Equations TH A1+TA1+TAA1
MAT1002 Applications of Differential and Difference Equations TH A1+TA1+TAA1
MAT1002 Applications of Differential and Difference Equations TH A1+TA1+TAA1
MAT1002 Applications of Differential and Difference Equations TH A1+TA1+TAA1
MAT1002 Applications of Differential and Difference Equations TH A1+TA1+TAA1
MAT1002 Applications of Differential and Difference Equations TH A1+TA1+TAA1
MAT1002 Applications of Differential and Difference Equations TH A2+TA2+TAA2
MAT1002 Applications of Differential and Difference Equations TH A2+TA2+TAA2
MAT1002 Applications of Differential and Difference Equations TH A2+TA2+TAA2
MAT1002 Applications of Differential and Difference Equations TH A2+TA2+TAA2
MAT1002 Applications of Differential and Difference Equations TH A2+TA2+TAA2
MAT1002 Applications of Differential and Difference Equations TH A2+TA2+TAA2
MAT1002 Applications of Differential and Difference Equations TH A2+TA2+TAA2
MAT1002 Applications of Differential and Difference Equations TH A2+TA2+TAA2
MAT1002 Applications of Differential and Difference Equations TH A2+TA2+TAA2
MAT1002 Applications of Differential and Difference Equations TH A2+TA2+TAA2
MAT1002 Applications of Differential and Difference Equations TH A2+TA2+TAA2
MAT1002 Applications of Differential and Difference Equations TH A2+TA2+TAA2
MAT1002 Applications of Differential and Difference Equations TH A2+TA2+TAA2
MAT1002 Applications of Differential and Difference Equations TH A2+TA2+TAA2
MAT1002 Applications of Differential and Difference Equations TH A2+TA2+TAA2
MAT1002 Applications of Differential and Difference Equations TH A2+TA2+TAA2
MAT1002 Applications of Differential and Difference Equations TH A2+TA2+TAA2
MAT1002 Applications of Differential and Difference Equations TH B1+TB1+TBB1
MAT1002 Applications of Differential and Difference Equations TH B1+TB1+TBB1
MAT1002 Applications of Differential and Difference Equations TH B1+TB1+TBB1
MAT1002 Applications of Differential and Difference Equations TH B1+TB1+TBB1
MAT1002 Applications of Differential and Difference Equations TH B1+TB1+TBB1
MAT1002 Applications of Differential and Difference Equations TH B1+TB1+TBB1
MAT1002 Applications of Differential and Difference Equations TH B1+TB1+TBB1
MAT1002 Applications of Differential and Difference Equations TH B1+TB1+TBB1
MAT1002 Applications of Differential and Difference Equations TH B1+TB1+TBB1
MAT1002 Applications of Differential and Difference Equations TH B1+TB1+TBB1
MAT1002 Applications of Differential and Difference Equations TH B1+TB1+TBB1
MAT1002 Applications of Differential and Difference Equations TH B1+TB1+TBB1
MAT1002 Applications of Differential and Difference Equations TH B1+TB1+TBB1
MAT1002 Applications of Differential and Difference Equations TH B1+TB1+TBB1
MAT1002 Applications of Differential and Difference Equations TH B1+TB1+TBB1
MAT1002 Applications of Differential and Difference Equations TH B1+TB1+TBB1
MAT1002 Applications of Differential and Difference Equations TH B2+TB2+TBB2
MAT1002 Applications of Differential and Difference Equations TH B2+TB2+TBB2
MAT1002 Applications of Differential and Difference Equations TH B2+TB2+TBB2
MAT1002 Applications of Differential and Difference Equations TH B2+TB2+TBB2
MAT1002 Applications of Differential and Difference Equations TH B2+TB2+TBB2
MAT1002 Applications of Differential and Difference Equations TH B2+TB2+TBB2
MAT1002 Applications of Differential and Difference Equations TH B2+TB2+TBB2
MAT1002 Applications of Differential and Difference Equations TH B2+TB2+TBB2
MAT1002 Applications of Differential and Difference Equations TH B2+TB2+TBB2
MAT1002 Applications of Differential and Difference Equations TH B2+TB2+TBB2
MAT1002 Applications of Differential and Difference Equations TH B2+TB2+TBB2
MAT1002 Applications of Differential and Difference Equations TH B2+TB2+TBB2
MAT1002 Applications of Differential and Difference Equations TH B2+TB2+TBB2
MAT1002 Applications of Differential and Difference Equations TH B2+TB2+TBB2
MAT1002 Applications of Differential and Difference Equations TH B2+TB2+TBB2
MAT1002 Applications of Differential and Difference Equations TH B2+TB2+TBB2
MAT1002 Applications of Differential and Difference Equations TH B2+TB2+TBB2
MAT1009 Applied Linear Algebra TH A1+TA1+TAA1
MAT1009 Applied Linear Algebra TH A1+TA1+TAA1
MAT1009 Applied Linear Algebra TH A1+TA1+TAA1
MAT1009 Applied Linear Algebra TH A2+TA2+TAA2
MAT1009 Applied Linear Algebra TH A2+TA2+TAA2
MAT1009 Applied Linear Algebra TH A2+TA2+TAA2
MAT1009 Applied Linear Algebra TH B1+TB1+TBB1
MAT1009 Applied Linear Algebra TH B1+TB1+TBB1
MAT1009 Applied Linear Algebra TH B1+TB1+TBB1
MAT1009 Applied Linear Algebra TH B2+TB2+TBB2
MAT1009 Applied Linear Algebra TH B2+TB2+TBB2
MAT1014 Fundamental Statistics ETH A1+TA1
MAT1014 Fundamental Statistics ETH A1+TA1
MAT1014 Fundamental Statistics ETH A1+TA1
MAT1014 Fundamental Statistics ETH A2+TA2
MAT1014 Fundamental Statistics ETH A2+TA2
MAT1014 Fundamental Statistics ETH C1+TC1
MAT1014 Fundamental Statistics ETH C1+TC1
MAT1014 Fundamental Statistics ETH C1+TCC1
MAT1014 Fundamental Statistics ETH C2+TC2
MAT1014 Fundamental Statistics ETH C2+TC2
MAT1014 Fundamental Statistics ETH C2+TCC2
MAT1014 Fundamental Statistics ELA L11+L12
MAT1014 Fundamental Statistics ELA L15+L16
MAT1014 Fundamental Statistics ELA L17+L18
MAT1014 Fundamental Statistics ELA L23+L24
MAT1014 Fundamental Statistics ELA L3+L4
MAT1014 Fundamental Statistics ELA L37+L38
MAT1014 Fundamental Statistics ELA L39+L40
MAT1014 Fundamental Statistics ELA L41+L42
MAT1014 Fundamental Statistics ELA L53+L54
MAT1014 Fundamental Statistics ELA L55+L56
MAT1014 Fundamental Statistics ELA L57+L58
MAT1014 Fundamental Statistics ELA L7+L8
MAT1014 Fundamental Statistics ELA L9+L10
MAT1017 Statistical Methods ETH E1+TE1
MAT1017 Statistical Methods ETH E2+TE2
MAT1017 Statistical Methods ETH G2+TG2
MAT1017 Statistical Methods ELA L15+L16
MAT1017 Statistical Methods ELA L27+L28
MAT1017 Statistical Methods ELA L51+L52
MAT1023 Mathematics - I TH B1+TB1+TBB1
MAT1023 Mathematics - I TH B1+TB1+TBB1
MAT1023 Mathematics - I TH B2+TB2+TBB2
MAT2010 Linear Algebra TH A2+TA2+TAA2
MAT2010 Linear Algebra TH B1+TB1+TBB1
MAT2010 Linear Algebra TH B2+TB2+TBB2
MEC1008 Engineering Mechanics TH D1+SD1+TD1
MEC1008 Engineering Mechanics TH D1+TD1+TDD1
MEC1008 Engineering Mechanics TH D2+SD2+TD2
MEC1008 Engineering Mechanics TH D2+TD2+TDD2
PHY1008 Modern Physics ETH B1+TB1
PHY1008 Modern Physics ETH C1+TC1
PHY1008 Modern Physics ETH C1+TC1
PHY1008 Modern Physics ETH C1+TC1
PHY1008 Modern Physics ETH C1+TC1
PHY1008 Modern Physics ETH C1+TC1
PHY1008 Modern Physics ETH C1+TC1
PHY1008 Modern Physics ETH C1+TC1
PHY1008 Modern Physics ETH C1+TCC1
PHY1008 Modern Physics ETH C1+TCC1
PHY1008 Modern Physics ETH C1+TCC1
PHY1008 Modern Physics ETH C2+TC2
PHY1008 Modern Physics ETH C2+TC2
PHY1008 Modern Physics ETH C2+TC2
PHY1008 Modern Physics ETH C2+TC2
PHY1008 Modern Physics ETH C2+TC2
PHY1008 Modern Physics ETH C2+TC2
PHY1008 Modern Physics ETH C2+TC2
PHY1008 Modern Physics ETH C2+TC2
PHY1008 Modern Physics ETH C2+TCC2
PHY1008 Modern Physics ETH C2+TCC2
PHY1008 Modern Physics ETH C2+TCC2
PHY1008 Modern Physics ETH D1+TD1
PHY1008 Modern Physics ETH D1+TD1
PHY1008 Modern Physics ETH D1+TD1
PHY1008 Modern Physics ETH D1+TD1
PHY1008 Modern Physics ETH D1+TD1
PHY1008 Modern Physics ETH D1+TD1
PHY1008 Modern Physics ETH D1+TD1
PHY1008 Modern Physics ETH D1+TD1
PHY1008 Modern Physics ETH D1+TDD1
PHY1008 Modern Physics ETH D1+TDD1
PHY1008 Modern Physics ETH D1+TDD1
PHY1008 Modern Physics ETH D2+TD2
PHY1008 Modern Physics ETH D2+TD2
PHY1008 Modern Physics ETH D2+TD2
PHY1008 Modern Physics ETH D2+TD2
PHY1008 Modern Physics ETH D2+TD2
PHY1008 Modern Physics ETH D2+TD2
PHY1008 Modern Physics ETH D2+TD2
PHY1008 Modern Physics ETH D2+TDD2
PHY1008 Modern Physics ETH D2+TDD2
PHY1008 Modern Physics ETH D2+TDD2
PHY1008 Modern Physics ELA L1+L2
PHY1008 Modern Physics ELA L1+L2
PHY1008 Modern Physics ELA L11+L12
PHY1008 Modern Physics ELA L11+L12
PHY1008 Modern Physics ELA L13+L14
PHY1008 Modern Physics ELA L15+L16
PHY1008 Modern Physics ELA L17+L18
PHY1008 Modern Physics ELA L17+L18
PHY1008 Modern Physics ELA L19+L20
PHY1008 Modern Physics ELA L19+L20
PHY1008 Modern Physics ELA L21+L22
PHY1008 Modern Physics ELA L21+L22
PHY1008 Modern Physics ELA L23+L24
PHY1008 Modern Physics ELA L23+L24
PHY1008 Modern Physics ELA L25+L26
PHY1008 Modern Physics ELA L27+L28
PHY1008 Modern Physics ELA L29+L30
PHY1008 Modern Physics ELA L29+L30
PHY1008 Modern Physics ELA L3+L4
PHY1008 Modern Physics ELA L31+L32
PHY1008 Modern Physics ELA L31+L32
PHY1008 Modern Physics ELA L33+L34
PHY1008 Modern Physics ELA L33+L34
PHY1008 Modern Physics ELA L35+L36
PHY1008 Modern Physics ELA L37+L38
PHY1008 Modern Physics ELA L37+L38
PHY1008 Modern Physics ELA L39+L40
PHY1008 Modern Physics ELA L39+L40
PHY1008 Modern Physics ELA L41+L42
PHY1008 Modern Physics ELA L41+L42
PHY1008 Modern Physics ELA L43+L44
PHY1008 Modern Physics ELA L45+L46
PHY1008 Modern Physics ELA L45+L46
PHY1008 Modern Physics ELA L47+L48
PHY1008 Modern Physics ELA L49+L50
PHY1008 Modern Physics ELA L5+L6
PHY1008 Modern Physics ELA L51+L52
PHY1008 Modern Physics ELA L53+L54
PHY1008 Modern Physics ELA L53+L54
PHY1008 Modern Physics ELA L55+L56
PHY1008 Modern Physics ELA L55+L56
PHY1008 Modern Physics ELA L57+L58
PHY1008 Modern Physics ELA L7+L8
PHY1008 Modern Physics ELA L9+L10
PHY1008 Modern Physics ELA L9+L10
SWE2005 Concepts of Object Oriented Programming ETH D1+TD1
SWE2005 Concepts of Object Oriented Programming ETH D1+TDD1
SWE2005 Concepts of Object Oriented Programming ETH D2+TD2
SWE2005 Concepts of Object Oriented Programming ETH D2+TDD2
SWE2005 Concepts of Object Oriented Programming ETH E1+TE1
SWE2005 Concepts of Object Oriented Programming ETH E1+TE1
SWE2005 Concepts of Object Oriented Programming ETH E1+TE1
SWE2005 Concepts of Object Oriented Programming ETH E2+TE2
SWE2005 Concepts of Object Oriented Programming ETH E2+TE2
SWE2005 Concepts of Object Oriented Programming ETH E2+TE2
SWE2005 Concepts of Object Oriented Programming ELA L13+L14
SWE2005 Concepts of Object Oriented Programming ELA L21+L22
SWE2005 Concepts of Object Oriented Programming ELA L27+L28
SWE2005 Concepts of Object Oriented Programming ELA L27+L28
SWE2005 Concepts of Object Oriented Programming ELA L3+L4
SWE2005 Concepts of Object Oriented Programming ELA L31+L32
SWE2005 Concepts of Object Oriented Programming ELA L33+L34
SWE2005 Concepts of Object Oriented Programming ELA L45+L46
SWE2005 Concepts of Object Oriented Programming ELA L47+L48
SWE2005 Concepts of Object Oriented Programming ELA L49+L50
SWE2005 Concepts of Object Oriented Programming ELA L51+L52
SWE2005 Concepts of Object Oriented Programming ELA L57+L58
`;

// Credit lookup mapping
const CREDIT_MAP = {
  BBT1002: 4,
  CHY1008: 4,
  CHY1009: 4,
  CHY1010: 4,
  CSE1022: 4,
  CSE2014: 4,
  ECE1002: 4,
  ECE1003: 4,
  ECE1006: 4,
  ECE2001: 4,
  ECE2012: 4,
  ENG1002: 3,
  ENG1006: 3,
  ENG1009: 3,
  ENG2001: 3,
  ENG2004: 3,
  HUM1001: 3,
  LIB1009: 2,
  LIB1023: 1,
  MAT1002: 4,
  MAT1009: 4,
  MAT1014: 4,
  MAT1017: 4,
  MAT1023: 4,
  MAT2010: 4,
  MEC1008: 4,
  PHY1008: 4,
  SWE2005: 4,
};

const lines = rawData.trim().split('\n');
const rawSlotsList = [];
const coursesMap = {};

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed) continue;

  const parts = trimmed.split(/\s+/);
  const slot = parts.pop();
  const type = parts.pop();
  const code = parts.shift();
  const title = parts.join(' ');

  rawSlotsList.push({
    courseCode: code,
    courseTitle: title,
    courseType: type,
    slot: slot,
    faculty: "",
    venue: ""
  });

  if (!coursesMap[code]) {
    coursesMap[code] = {
      id: code,
      code: code,
      name: title,
      type: type,
      credits: CREDIT_MAP[code] || 4,
      theorySlots: [],
      labSlots: []
    };
  }

  // Determine if type needs updating (e.g. ETH + ELA)
  if (type === 'ETH' || type === 'TH') {
    if (!coursesMap[code].type.includes('ETH') && !coursesMap[code].type.includes('TH')) {
      coursesMap[code].type = type;
    }
  } else if (type === 'ELA' || type === 'LO') {
    if (coursesMap[code].type === 'ETH' || coursesMap[code].type.includes('ETH')) {
      coursesMap[code].type = 'ETH'; // Embedded Theory with Lab
    } else if (coursesMap[code].type === 'TH') {
      coursesMap[code].type = 'ETH';
    } else {
      coursesMap[code].type = type;
    }
  }

  if (slot && slot !== 'NIL' && slot !== 'NILL') {
    const isLab = slot.startsWith('L') && /[0-9]/.test(slot);
    if (isLab) {
      if (!coursesMap[code].labSlots.includes(slot)) {
        coursesMap[code].labSlots.push(slot);
      }
    } else {
      if (!coursesMap[code].theorySlots.includes(slot)) {
        coursesMap[code].theorySlots.push(slot);
      }
    }
  }
}

// Write the complete raw slot offerings list (including all duplicates/sections)
fs.writeFileSync('lib/winter_raw_slots.json', JSON.stringify(rawSlotsList, null, 2) + '\n');
console.log(`Saved ${rawSlotsList.length} total raw slot offerings to lib/winter_raw_slots.json`);

// Write the deduplicated courses catalog for clean student timetable planning
const finalCourses = Object.values(coursesMap);
fs.writeFileSync('lib/courses.json', JSON.stringify(finalCourses, null, 2) + '\n');
console.log(`Saved ${finalCourses.length} unique courses to lib/courses.json`);
