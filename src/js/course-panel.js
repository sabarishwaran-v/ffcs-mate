/*
 *  This file contains the events and functions applied to
 *  the course panel
 */

import 'easy-autocomplete/dist/easy-autocomplete.min.css';
import 'bootstrap-select/dist/css/bootstrap-select.min.css';

/*
 *  The package bootstrap-select is not compatable with bootstrap 5 at the
 *  time of writing this. Once bootstrap-select has been upgraded to a stable
 *  version with bootstrap 5 support, the bootstrap 4 javascript import &
 *  it's dependency (bootstrap4) can be removed.
 */
import 'easy-autocomplete/dist/jquery.easy-autocomplete';
import 'bootstrap4/dist/js/bootstrap.bundle';
import 'bootstrap-select/dist/js/bootstrap-select';

$(() => {
    /*
        Campus Selection Logic
     */
    $('.campus-option').on('click', function(e) {
        e.preventDefault();
        var selectedCampus = $(this).data('campus');
        
        // Update campus button text
        $('#campus').html('<i class="fas fa-map-marker-alt text-danger"></i>&nbsp; ' + selectedCampus + ' Campus');
        
        // Update active class
        $('.campus-option').removeClass('fw-bold active');
        $(this).addClass('fw-bold active');
        
        if (selectedCampus === 'VIT-AP') {
            $('#semester').text('Winter Semester Freshers 25-26');
            $('#semester-dropdown').html(`
                <li><a class="dropdown-item fw-bold" href="#winter_freshers_25">Winter Semester Freshers 25-26</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" href="#" data-bs-toggle="modal" data-bs-target="#request-campus-modal"><i class="fas fa-plus-circle text-primary"></i> Add Semester</a></li>
            `);
            $('#course-input').prop('disabled', false).attr('placeholder', 'e.g. CSE1001');
            $('#add-course-button, #clear-panel-button').prop('disabled', false);
            
            // Show timetable layout
            $('#timetable-view-container, #course-list-container, #option-buttons').show();
            $('#no-data-container').hide();
        } else {
            $('#semester').text('Select Semester');
            $('#semester-dropdown').html(`
                <li><a class="dropdown-item" href="#" data-bs-toggle="modal" data-bs-target="#request-campus-modal"><i class="fas fa-plus-circle text-primary"></i> Add Semester</a></li>
            `);
            
            // Disable search input and clear everything since there's no data
            $('#course-input').prop('disabled', true).attr('placeholder', 'No Semesters Available');
            $('#add-course-button, #clear-panel-button').prop('disabled', true);
            clearPanel();
            
            // Hide timetable layout and show empty state
            $('#timetable-view-container, #daywise-view-container, #course-list-container, #option-buttons').hide();
            $('#no-data-container').show();
        }
    });

    /*
        Event to clear panel when input is empty
     */
    $('#course-input').on('input', function () {
        if ($(this).val().trim() === '') {
            clearPanel();
        }
    });

    /*
        Event to listen to changes in the slot filter
     */
    $('#slot-filter').on(
        'changed.bs.select',
        function (e, clickedIndex, isSelected, previousValue) {
            /*
            If Select All / Deselect All is clicked, isSelected will be null
         */
            if (isSelected === null) {
                $('#slot-buttons button').show();
                return;
            }

            // If the current state has no selected items, show everything
            if (previousValue.length === 1 && !isSelected) {
                $('#slot-buttons button').show();
                return;
            }

            // If the previous state had nothing selected, hide everything
            // and display the selected option
            if (previousValue.length === 0) {
                $('#slot-buttons button').hide();
            }

            var option = $('option', this)[clickedIndex].value;

            if (isSelected) {
                $('#slot-buttons button:not(:visible)').each(function () {
                    if ($(this).data('slot') === option) {
                        $(this).show();
                    }
                });
            } else {
                $('#slot-buttons button:visible').each(function () {
                    if ($(this).data('slot') === option) {
                        $(this).hide();
                    }
                });
            }

            if ($('#slot-buttons button.selected:not(:visible)').length > 0) {
                $('#slot-buttons button.selected').removeClass('selected');
                $('#advanced-options input').val('');
            }
        },
    );

    // Hack to turn off auto focus, should be removed when
    // the bug in bootstrap-select is fixed
    $('#filter-by-slot').on('change', function () {
        $(this)
            .siblings('.dropdown-menu')
            .children('.bs-searchbox')
            .children('input[type="search"]')
            .trigger('blur');
    });

    $('#slot-buttons').on('click', 'button', function () {
        var $btn = $(this);

        // Mobile UX Fix: If the button is already selected, a second tap adds the course
        // This avoids the need for a rapid double-tap (which causes mobile browsers to zoom).
        if ($btn.hasClass('selected')) {
            $('#add-course-button').trigger('click');
            $btn.trigger('blur');
            return;
        }

        var slotString = $btn.data('slot');
        var courseCode = $btn.data('code');

        // Duplicate Course Check (Priority over clash)
        if (slotString && courseCode && activeTable && activeTable.data) {
            var isNewCourseLab = /^L\d+/.test(slotString);
            var componentType = isNewCourseLab ? "Lab" : "Theory";
            var isDuplicate = activeTable.data.some(c => {
                if (c.courseCode === courseCode) {
                    var isExistingLab = c.slots.some(s => /^L\d+/.test(s));
                    return isNewCourseLab === isExistingLab;
                }
                return false;
            });

            if (isDuplicate) {
                if (typeof showPanelError === 'function') {
                    showPanelError(`Course <strong>${courseCode}</strong> (${componentType}) is already chosen.`);
                }
                return; // Block early
            }
        }

        // Pre-validate clash before allowing selection
        if (slotString && courseCode && typeof window.checkSlotClash === 'function') {
            var slots = [];
            try {
                slotString.split(/\s*\+\s*/).forEach(function (el) {
                    if (el && $('.' + el).length) slots.push(el);
                });
            } catch (error) {}

            var courseId = 0;
            if (activeTable && activeTable.data && activeTable.data.length != 0) {
                var lastAddedCourse = activeTable.data[activeTable.data.length - 1];
                courseId = lastAddedCourse.courseId + 1;
            }

            // Temporarily inject to check for clash
            slots.forEach(function (slot) {
                var $divElement = $(`<div class="temp-clash-check" data-course="course${courseId}">${courseCode}</div>`);
                if (slot[0] == 'L') $divElement.attr('data-is-lab', 'true').data('is-lab', true);
                else $divElement.attr('data-is-theory', 'true').data('is-theory', true);
                $(`#timetable tr .${slot}`).append($divElement);
            });

            var myCourseKey = `course${courseId}`;
            var clashData = window.checkSlotClash();

            if (clashData && clashData[myCourseKey]) {
                var clashNames = [];
                clashData[myCourseKey].forEach(function(clashingCourseKey) {
                    var $clashingDivs = $(`#timetable div[data-course="${clashingCourseKey}"]`).not('.temp-clash-check');
                    if ($clashingDivs.length) {
                        var name = $clashingDivs.first().text().split('-')[0];
                        if (!clashNames.includes(name)) clashNames.push(name);
                        
                        // Trigger visual clash warning (shake & glow)
                        var $cell = $clashingDivs.parent();
                        $cell.addClass('clash-shake');
                        setTimeout(() => $cell.removeClass('clash-shake'), 400);
                    }
                });

                var clashMessage = clashNames.length > 0 ? clashNames.join(', ') : "another overlapping course";
                if (typeof showPanelError === 'function') {
                    showPanelError("Cannot select slot. " + slots.join(', ') + " clashes with " + clashMessage);
                }

                // Revert DOM instantly
                $('.temp-clash-check').remove();
                window.checkSlotClash(); // clear any clash classes
                return; // Block the user before selecting!
            }

            // Cleanup temp
            $('.temp-clash-check').remove();
            window.checkSlotClash();
        }

        $('.slot-button.selected').removeClass('selected');
        $btn.attr('class', 'slot-button selected');

        $('#slot-input').val(slotString);
        $('#faculty-input').val($btn.data('faculty'));
        $('#venue-input').val($btn.data('venue'));
        $('#credits-input').val($btn.data('credits'));
        $('#is-project-input').val($btn.data('type') === 'EPJ' ? 'true' : 'false');
    });

    /*
        Double click event to quickly add a course
     */
    $('#slot-buttons').on('dblclick', 'button', function () {
        if (!$(this).hasClass('selected')) return;
        $('#add-course-button').trigger('click');
        $(this).trigger('blur');
    });

    /*
        Click event to toggle advanced options
     */
    $('#advanced-toggle').on('click', function () {
        if ($(this).attr('data-state') === 'enabled') {
            $(this).text('Show Advanced Options');
            $(this).attr('class', 'btn btn-outline-secondary');
            $(this).attr('data-state', 'disabled');
        } else {
            $(this).text('Hide Advanced Options');
            $(this).attr('class', 'btn btn-secondary');
            $(this).attr('data-state', 'enabled');
        }

        $('#advanced-options').slideToggle();
    });

    /*
        Click event to clear the panel
     */
    $('#clear-panel-button').on('click', function () {
        clearPanel();
    });

    /*
        Click event to add a course
     */
    $('#add-course-button').on('click', function () {
        var course = $('#course-input').val().trim().split('-');
        var faculty = $('#faculty-input').val().trim();
        var slotString = $('#slot-input').val().toUpperCase().trim();
        var venue = $('#venue-input').val().trim();
        var credits = $('#credits-input').val().trim();
        var isProject = $('#is-project-input').val();

        // Reset is-project-input once read
        $('#is-project-input').val('false');

        if (course[0] == '') {
            $('#course-input').trigger('focus');
            return;
        }

        if (slotString == '') {
            if ($('#advanced-toggle').attr('data-state') != 'enabled') {
                $('#advanced-toggle').trigger('click');
            }

            $('#slot-input').trigger('focus');
            return;
        }

        var slots = (function () {
            var arr = [];

            try {
                slotString.split(/\s*\+\s*/).forEach(function (el) {
                    if (el && $('.' + el)) {
                        arr.push(el);
                    }
                });
            } catch (error) {
                arr = [];
            }

            return arr;
        })();

        var courseId = 0;
        if (activeTable.data.length != 0) {
            var lastAddedCourse = activeTable.data[activeTable.data.length - 1];
            courseId = lastAddedCourse.courseId + 1;
        }

        var courseCode = course[0].trim();
        var courseTitle = course.slice(1).join('-').trim();

        // Duplicate Course Check (Separating Theory and Lab)
        var isNewCourseLab = slots.some(s => /^L\d+/.test(s));
        var componentType = isNewCourseLab ? "Lab" : "Theory";

        var isDuplicate = activeTable.data.some(c => {
            if (c.courseCode === courseCode) {
                var isExistingLab = c.slots.some(s => /^L\d+/.test(s));
                return isNewCourseLab === isExistingLab;
            }
            return false;
        });

        if (isDuplicate) {
            showPanelError(`Course <strong>${courseCode}</strong> (${componentType}) is already chosen.`);
            return;
        }

        var courseData = {
            courseId: courseId,
            courseCode: courseCode,
            courseTitle: courseTitle,
            faculty: faculty,
            slots: slots,
            venue: venue,
            credits: credits,
            isProject: isProject,
        };

        // Clashing logic: Pre-validate by temporarily injecting into the DOM
        courseData.slots.forEach(function (slot) {
            var $divElement = $(`<div class="temp-clash-check" data-course="course${courseId}">${courseCode}</div>`);
            if (slot[0] == 'L') $divElement.attr('data-is-lab', 'true').data('is-lab', true);
            else $divElement.attr('data-is-theory', 'true').data('is-theory', true);
            $(`#timetable tr .${slot}`).append($divElement);
        });

        var myCourseKey = `course${courseId}`;
        var clashData = typeof window.checkSlotClash === 'function' ? window.checkSlotClash() : null;

        if (clashData && clashData[myCourseKey]) {
            var clashNames = [];
            clashData[myCourseKey].forEach(function(clashingCourseKey) {
                var $clashingDivs = $(`#timetable div[data-course="${clashingCourseKey}"]`).not('.temp-clash-check');
                if ($clashingDivs.length) {
                    var name = $clashingDivs.first().text().split('-')[0];
                    if (!clashNames.includes(name)) clashNames.push(name);
                    
                    // Trigger visual clash warning (shake & glow)
                    var $cell = $clashingDivs.parent();
                    $cell.addClass('clash-shake');
                    setTimeout(() => $cell.removeClass('clash-shake'), 400);
                }
            });

            var clashMessage = clashNames.length > 0 ? clashNames.join(', ') : "another overlapping course";
            showPanelError("Cannot add course. Slot " + slots.join(', ') + " is clashing with " + clashMessage);

            // Revert DOM instantly
            $('.temp-clash-check').remove();
            if (typeof window.checkSlotClash === 'function') window.checkSlotClash(); // clear any clash classes from the DOM
            return; // Block the user before saving!
        }

        // If no clash, clean up temp elements and proceed to actually add it
        $('.temp-clash-check').remove();
        if (typeof window.checkSlotClash === 'function') window.checkSlotClash(); // Reset clash state back to clean
        
        activeTable.data.push(courseData);
        addCourseToCourseList(courseData);
        addCourseToTimetable(courseData);

        var totalCredits = 0;
        activeTable.data.forEach(function (el) {
            totalCredits += Number(el.credits);
        });
        $('#total-credits').text(totalCredits);

        clearPanel();
    });
});

const courses_data = {
    courses: [],
    all_data: [],
};

/*
    Global function to show error banners across the application
 */
function showPanelError(message) {
    $('.global-error-msg').remove();
    $('body').append(`
        <div class="alert alert-danger global-error-msg shadow-lg d-flex align-items-center" role="alert" style="position: fixed; top: 30px; left: 50%; transform: translateX(-50%); z-index: 9999; border-radius: 50rem; font-weight: 600; padding: 12px 30px; border: none;">
            <i class="fas fa-exclamation-circle fs-5 me-3"></i> 
            <span>${message}</span>
        </div>
    `);
    setTimeout(() => {
        $('.global-error-msg').fadeOut(400, function() { $(this).remove(); });
    }, 4000);
}

/*
    Function to get the courses based on the selected campus
 */
window.getCourses = () => {
    courses_data.all_data = require('../data/all_data_winter_freshers_25.json');
    courses_data.courses = require('../data/courses_winter_freshers_25.json');

    initializeAutocomplete();
};

/*
    Function to fill the course input with unique courses
 */
function initializeAutocomplete() {
    const courseOptions = {
        data: courses_data.courses,
        getValue: function (el) {
            return el.CODE + ' - ' + el.TITLE;
        },
        list: {
            match: {
                enabled: true,
            },
            maxNumberOfElements: 10,
            onChooseEvent: function () {
                var title = $('#course-input').getSelectedItemData().TITLE;
                var code = $('#course-input').getSelectedItemData().CODE;

                $('#course-input').val(code + ' - ' + title);
                addSlotButtons(code);
            },
        },
    };

    $('#course-input').easyAutocomplete(courseOptions);
    $('div .easy-autocomplete').removeAttr('style');
}

/*
    Function to map slots to credits based on Freshers Winter Semester 2025-26 rules
 */
function getCreditsFromSlot(slotString) {
    if (!slotString) return '';
    const slots4 = ['A1+SA1+TA1', 'B1+SB1+TB1', 'C1+SC1+TC1', 'D1+SD1+TD1', 'E1+SE1+TE1', 'F1+SF1+TF1', 'A2+SA2+TA2', 'B2+SB2+TB2', 'C2+SC2+TC2', 'D2+SD2+TD2', 'E2+SE2+TE2', 'F2+SF2+TF2', 'D1+TD1+TDD1', 'E1+TE1+TEE1', 'F1+TF1+TFF1', 'D2+TD2+TDD2', 'E2+TE2+TEE2', 'F2+TF2+TFF2'];
    const slots3 = ['A1+TA1', 'B1+TB1', 'C1+TC1', 'D1+TD1', 'E1+TE1', 'F1+TF1', 'A2+TA2', 'B2+TB2', 'C2+TC2', 'D2+TD2', 'E2+TE2', 'F2+TF2', 'D1+TDD1', 'E1+TEE1', 'F1+TFF1', 'G1+TG1', 'D2+TDD2', 'E2+TEE2', 'F2+TFF2', 'G2+TG2'];
    const slots2 = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G1', 'G2'];
    const slots1 = ['TA1', 'TB1', 'TC1', 'TD1', 'TE1', 'TF1', 'TA2', 'TB2', 'TC2', 'TD2', 'TE2', 'TF2', 'TDD1', 'TEE1', 'TFF1', 'TG1', 'TDD2', 'TEE2', 'TFF2', 'TG2'];
    
    if (slots4.includes(slotString)) return 4;
    if (slots3.includes(slotString)) return 3;
    if (slots2.includes(slotString)) return 2;
    if (slots1.includes(slotString)) return 1;
    
    if (slotString.includes('L')) return slotString.split('+').length / 2;
    return '';
}

/*
    Function to build a slot button
 */
function buildSlotButton(courseData) {
    var $slotButton = $('<button class="slot-button" type="button"></button>');
    var $h6 = $('<h6 class="slot-button-heading"></h6>');
    var $p = $('<p class="slot-button-text"></p>');

    var computedCredits = courseData.CREDITS || getCreditsFromSlot(courseData.SLOT);
    var creditsText = computedCredits ? computedCredits + ' Credits' : '';

    $h6.text(courseData.SLOT);
    $p.text(
        [courseData.FACULTY, courseData.VENUE, courseData.TYPE, creditsText]
            .filter(function (el) {
                if (el != '') {
                    return el;
                }
            })
            .join(' | '),
    );

    $slotButton.append($h6);
    $slotButton.append($p);

    $slotButton.data('code', courseData.CODE);
    $slotButton.data('title', courseData.TITLE);
    $slotButton.data('slot', courseData.SLOT);
    $slotButton.data('faculty', courseData.FACULTY);
    $slotButton.data('type', courseData.TYPE);
    $slotButton.data('venue', courseData.VENUE);
    $slotButton.data('credits', computedCredits);

    return $slotButton;
}

/*
    Function to add slot buttons and filter options
 */
window.addSlotButtons = (courseCode) => {
    $('#slot-buttons').html('');
    resetFilters();

    var theorySlotGroup = [];
    var labSlotGroup = [];
    var matchedData = [];

    $.each(courses_data.all_data, function (key, value) {
        if (value.CODE === courseCode) {
            matchedData.push(value);
        }
    });

    matchedData.sort(function(a, b) {
        var isLabA = a.SLOT[0] === 'L' ? 1 : 0;
        var isLabB = b.SLOT[0] === 'L' ? 1 : 0;
        if (isLabA !== isLabB) return isLabA - isLabB;
        return a.SLOT.localeCompare(b.SLOT, undefined, { numeric: true, sensitivity: 'base' });
    });

    matchedData.forEach(function (value) {
        var $slotButton = buildSlotButton(value);

        // Checking if the slot belongs to lab or theory
        if (value.SLOT[0] === 'L') {
            if (labSlotGroup.indexOf(value.SLOT) === -1) {
                labSlotGroup.push(value.SLOT);
            }
        } else {
            if (theorySlotGroup.indexOf(value.SLOT) === -1) {
                theorySlotGroup.push(value.SLOT);
            }
        }

        // Injecting the slot button to the document body
        $('#slot-buttons').append($slotButton);
    });

    /*
        Adding the theory slots to the filter
     */
    if (theorySlotGroup.length) {
        var $theorySlotGroup = $('<optgroup label="Theory"></optgroup>');

        theorySlotGroup.forEach(function (el) {
            var $option = $(`<option value="${el}">${el}</option>`);
            $theorySlotGroup.append($option);
        });

        $('#slot-filter').append($theorySlotGroup);
    }

    /*
        Adding the lab slots to the filter
     */
    if (labSlotGroup.length) {
        var $labSlotGroup = $('<optgroup label="Lab"></optgroup>');

        labSlotGroup.forEach(function (el) {
            var $option = $(`<option value="${el}">${el}</option>`);
            $labSlotGroup.append($option);
        });

        $('#slot-filter').append($labSlotGroup);
    }

    if ($('#slot-filter option').length) {
        $('#slot-filter').prop('disabled', false);
    } else {
        $('#slot-filter').prop('disabled', true);
    }

    $('#slot-filter').selectpicker('refresh');
};

/*
    Function to reset all filters, deletes all filter options
 */
function resetFilters() {
    // Resetting the slot filter
    $('#slot-filter').html('');
    $('#slot-filter').prop('disabled', true);
    $('#slot-filter').selectpicker('refresh');
}

/*
    Function to clear the course panel
 */
window.clearPanel = () => {
    $('#course-panel input').val('');
    $('#slot-buttons').html('');
    resetFilters();
};
