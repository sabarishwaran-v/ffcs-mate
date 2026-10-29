import { describe, it, expect } from 'vitest';
import { parseMockHtml, parseMockHtmlDetailed } from '@/lib/mock-html-parser';
import fs from 'fs';
import path from 'path';

describe('Mock FFCS HTML Parser & Exception Diagnostics', () => {
  it('should parse real Mock FFCS HTML file accurately', () => {
    const filePath = path.join(process.cwd(), 'mock_html', 'profenglish.html');
    if (fs.existsSync(filePath)) {
      const html = fs.readFileSync(filePath, 'utf-8');
      const result = parseMockHtmlDetailed(html);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.courseCode).toBe('ENG2001');
      expect(result.data?.courseTitle).toBe('English for Professional Communication');
      expect(result.data?.credits).toBe(3);
      expect(result.data?.theoryOfferings.length).toBe(27);
      expect(result.data?.labOfferings.length).toBe(29);
      expect(result.data?.semesterMismatch).toBe(false);

      const d1Theory = result.data?.theoryOfferings.find(t => t.slot === 'D1');
      expect(d1Theory).toBeDefined();
      expect(d1Theory?.venue).toBeTruthy();
    }
  });

  it('should detect EMPTY_FILE exception', () => {
    const res = parseMockHtmlDetailed('');
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe('EMPTY_FILE');
    expect(res.error?.title).toBe('Empty File');
  });

  it('should detect LOGIN_PAGE exception when session expired', () => {
    const loginHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>VTOP Login</title></head>
        <body>
          <input type="text" name="txtUserName" id="txtUserName" />
          <input type="password" name="txtPassword" id="txtPassword" />
          <input type="text" name="captcha" id="captcha" />
        </body>
      </html>
    `;
    const res = parseMockHtmlDetailed(loginHtml);
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe('LOGIN_PAGE');
    expect(res.error?.title).toBe('VTOP Session Expired');
  });

  it('should detect TIMETABLE_PAGE_NOT_REGISTRATION exception', () => {
    const ttHtml = `
      <!DOCTYPE html>
      <html>
        <body>
          <h2>Time Table View - Student Registration</h2>
          <table class="timeTable"><tr><td>A1</td></tr></table>
        </body>
      </html>
    `;
    const res = parseMockHtmlDetailed(ttHtml);
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe('TIMETABLE_PAGE_NOT_REGISTRATION');
    expect(res.error?.title).toBe('Wrong Screen Saved');
  });

  it('should detect SEMESTER_MISMATCH exception for older Fall semesters', () => {
    const fallHtml = `
      <div>
        <span>COURSE DETAIL</span>
        <span>CSE1022 - Data Structures - Theory Only</span>
        <input id="courseCodehid" value="CSE1022">
        <a href="https://vtop.vitap.ac.in/semfallreg2025">Registration</a>
      </div>
    `;
    const res = parseMockHtmlDetailed(fallHtml);
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe('SEMESTER_MISMATCH');
    expect(res.error?.title).toBe('Semester Mismatch');
  });

  it('should detect NO_VTOP_COURSE_DATA exception for generic HTML', () => {
    const genericHtml = '<html><body><h1>Welcome to My Blog</h1></body></html>';
    const res = parseMockHtmlDetailed(genericHtml);
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe('NO_VTOP_COURSE_DATA');
  });

  it('should correctly parse theory slots with tutorial suffixes (e.g. E2+TE2, F2+TFF2) and lab slots', () => {
    const htmlWithTutorials = `
      <div>
        <span>COURSE DETAIL</span>
        <span>CSE1022 - Introduction to Programming - Embedded Theory and Lab</span>
        <input id="courseCodehid" value="CSE1022">
        <span>3 0 2 0 4.0</span>
        <table>
          <tr>
            <td colspan="4" class="component-header-ribbon"><div>Embedded Theory Slots</div></td>
          </tr>
          <tr>
            <td>E2+TE2</td>
            <td>CB-G13</td>
            <td>NARESH BODA</td>
            <td>84</td>
          </tr>
          <tr>
            <td>F2+TFF2</td>
            <td>CB-108</td>
            <td>POTHI REDDY KRISHNA MOHAN REDDY</td>
            <td>77</td>
          </tr>
          <tr>
            <td colspan="4" class="component-header-ribbon">Lab Slots</td>
          </tr>
          <tr>
            <td>L53+L54</td>
            <td>CB-419</td>
            <td>RAJESH VELPULA</td>
            <td>82</td>
          </tr>
        </table>
      </div>
    `;
    const res = parseMockHtmlDetailed(htmlWithTutorials);
    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
    expect(res.data?.theoryOfferings.length).toBe(2);
    expect(res.data?.theoryOfferings[0].slot).toBe('E2+TE2');
    expect(res.data?.theoryOfferings[0].faculty).toBe('NARESH BODA');
    expect(res.data?.theoryOfferings[0].venue).toBe('CB-G13');
    expect(res.data?.theoryOfferings[1].slot).toBe('F2+TFF2');
    expect(res.data?.labOfferings.length).toBe(1);
    expect(res.data?.labOfferings[0].slot).toBe('L53+L54');
    expect(res.data?.labOfferings[0].faculty).toBe('RAJESH VELPULA');
    expect(res.data?.labOfferings[0].venue).toBe('CB-419');
  });
});
