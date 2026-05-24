/*
 *  This file contains the events and functions applied to
 *  the timetable
 */

import localforage from 'localforage/dist/localforage';
import html2canvas from 'html2canvas/dist/html2canvas';
import { parse, isValid } from 'date-fns';

var timetableStorage = [
    {
        id: 0,
        name: 'Default Table',
        data: [],
        quick: [],
    },
];

window.activeTable = timetableStorage[0];

$(() => {
    /*
        Click event for the add table button
     */
    $('#tt-picker-add').on('click', function () {
        var newTableId = timetableStorage[timetableStorage.length - 1].id + 1;
        var newTableName = 'Table ' + newTableId;

        timetableStorage.push({
            id: newTableId,
            name: newTableName,
            data: [],
            quick: [],
        });

        addTableToPicker(newTableId, newTableName);
        switchTable(newTableId);
        updateLocalForage();
    });

    /*
        Click event for the timetable picker dropdown labels
     */
    $('#tt-picker-dropdown').on('click', '.tt-picker-label', function () {
        var selectedTableId = Number($(this).children('a').data('table-id'));
        switchTable(selectedTableId);
    });

    /*
        Click event to set the data attribute before opening the rename modal
     */
    $('#tt-picker-dropdown').on('click', '.tt-picker-rename', function () {
        var $a = $(this).closest('li').find('a:first');

        var tableId = Number($a.data('table-id'));
        var tableName = $a.text();

        $('#table-name').val(tableName).trigger('focus');
        $('#rename-tt-button').data('table-id', tableId);
    });

    /*
        Click event for the rename button in the rename modal
     */
    $('#rename-tt-button').on('click', function () {
        var tableId = $(this).data('table-id');
        var tableName = $('#table-name').val().trim();

        if (tableName == '') {
            tableName = 'Untitled Table';
        }

        renameTable(tableId, tableName);
    });

    /*
        Keydown event for the input table name field in the rename modal
     */
    $('#table-name').on('keydown', function (e) {
        if (e.key == 'Enter') {
            $('#rename-tt-button').trigger('click');
        }
    });

    /*
        Click event to set the data attribute before opening the delete modal
     */
    $('#tt-picker-dropdown').on('click', '.tt-picker-delete', function () {
        var tableId = Number(
            $(this).closest('li').find('a:first').data('table-id'),
        );

        $('#delete-tt-button').data('table-id', tableId);
    });

    /*
        Click event for the delete button in the delete modal
     */
    $('#delete-tt-button').on('click', function () {
        var tableId = $(this).data('table-id');
        deleteTable(tableId);

        if (timetableStorage.length == 1) {
            $('#tt-picker-dropdown .tt-picker-delete').first().remove();
        }
    });

    /*
        Click event for the download timetable button in the download modal
     */
    $('#download-tt-button').on('click', function () {
        var buttonText = $(this).html();
        $(this)
            .html(
                `<span
                    class="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                ></span>&nbsp;&nbsp;Please Wait`,
            )
            .attr('disabled', true);

        const width = $('#timetable')[0].scrollWidth;
        var $layout = $('<div></div>').css({
            padding: '2rem',
            position: 'absolute',
            top: 0,
            left: `calc(-${width}px - 4rem)`,
        });

        $layout = appendHeader($layout, width);

        const $timetableClone = $('#timetable').clone().css({
            width: width,
        });
        $('table', $timetableClone).css({
            margin: 0,
        });
        $('tr', $timetableClone).css({
            border: 'none',
        });

        $layout.append($timetableClone);
        $('body').append($layout);

        html2canvas($layout[0], {
            scrollX: -window.scrollX,
            scrollY: -window.scrollY,
        }).then((canvas) => {
            $layout.remove();
            $(this).html(buttonText).attr('disabled', false);

            var $a = $('<a></a>')
                .css({
                    display: 'none',
                })
                .attr('href', canvas.toDataURL('image/jpeg'))
                .attr(
                    'download',
                    `FFCS MATE ${activeTable.name} (Timetable).jpg`,
                );

            $('body').append($a);
            $a[0].click();
            $a.remove();
        });
    });

    /*
        Click event for the download course list button in the download modal
     */
    $('#download-course-list-button').on('click', function () {
        var buttonText = $(this).html();
        $(this)
            .html(
                `<span
                    class="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                ></span>&nbsp;&nbsp;Please Wait`,
            )
            .attr('disabled', true);

        const width = $('#course-list')[0].scrollWidth;
        var $layout = $('<div></div>').css({
            padding: '2rem',
            position: 'absolute',
            top: 0,
            left: `calc(-${width}px - 4rem)`,
        });

        $layout = appendHeader($layout, width);

        const $courseListClone = $('#course-list').clone().css({
            width: width,
            border: '1px solid var(--table-border-color)',
            'border-bottom': 'none',
        });
        $('table', $courseListClone).css({
            margin: 0,
        });
        $('tr', $courseListClone)
            .css({
                border: 'none',
            })
            .each(function () {
                if ($(this).children().length == 1) {
                    return;
                }

                $('th:last-child', this).remove();
                $('td:last-child', this).remove();
            });

        $layout.append($courseListClone);
        $('body').append($layout);

        html2canvas($layout[0], {
            scrollX: -window.scrollX,
            scrollY: -window.scrollY,
        }).then((canvas) => {
            $layout.remove();
            $(this).html(buttonText).attr('disabled', false);

            var $a = $('<a></a>')
                .css({
                    display: 'none',
                })
                .attr('href', canvas.toDataURL('image/jpeg'))
                .attr(
                    'download',
                    `FFCS MATE ${activeTable.name} (Course List).jpg`,
                );

            $('body').append($a);
            $a[0].click();
            $a.remove();
        });
    });

    /*
        Click event for the quick visualization button
     */
    $('#quick-toggle').on('click', function () {
        if ($(this).attr('data-state') == 'enabled') {
            $('i', this).prop('class', 'fas fa-eye');
            $('span', this).html('&nbsp;&nbsp;Enable Quick Visualization');
            $(this).attr('data-state', 'disabled');

            $('#timetable .highlight:not(:has(div))').removeClass('highlight');
        } else {
            $('i', this).prop('class', 'fas fa-eye-slash');
            $('span', this).html('&nbsp;&nbsp;Disable Quick Visualization');
            $(this).attr('data-state', 'enabled');

            activeTable.quick.forEach((el) =>
                $('#timetable')
                    .find('tr')
                    .eq(el[0])
                    .find('td')
                    .eq(el[1])
                    .addClass('highlight'),
            );
        }

        $('.quick-buttons').slideToggle();
    });

    /*
        Click event for the reset button in the reset modal
     */
    $('#reset-tt-button').on('click', function () {
        resetPage();
        activeTable.data = [];
        updateLocalForage();
    });
});

/*
    Function to add a header to the images
 */
function appendHeader($layout, width) {
    const $header = $('<div></div>')
        .css({
            width: width,
            'margin-bottom': '1rem',
        })
        .append(
            $('<h3>FFCS MATE</h3>').css({
                margin: 0,
                display: 'inline',
                color: '#9c27b0',
                'font-weight': 'bold',
            }),
        )
        .append(
            $(`<h3>AP Campus</h3>`).css({
                margin: 0,
                display: 'inline',
                color: '#707070',
                float: 'right',
            }),
        )
        .append(
            $('<hr>').css({
                'border-color': '#000000',
                'border-width': '2px',
            }),
        );
    const $title = $(`<h4>${activeTable.name}</h4>`).css({
        'margin-bottom': '1rem',
        width: width,
        'text-align': 'center',
    });

    return $layout.append($header).append($title);
}

/*
    Function to update the saved data
 */
function updateLocalForage() {
    localforage
        .setItem('timetableStorage', timetableStorage)
        .catch(console.error);
}

/*
    Function to get the table index
 */
function getTableIndex(id) {
    return timetableStorage.findIndex((el) => el.id == id);
}

/*
    Function to fill the timetable and course list
 */
function fillPage() {
    $.each(activeTable.data, function (index, courseData) {
        addCourseToCourseList(courseData);
        addCourseToTimetable(courseData);
    });
}

/*
    Function to change the active table
 */
function switchTable(tableId) {
    resetPage();

    activeTable = timetableStorage[getTableIndex(tableId)];
    updatePickerLabel(activeTable.name);
    fillPage();
}

/*
    Function to rename the timetable picker label
 */
function updatePickerLabel(tableName) {
    $('#tt-picker-button').text(tableName);
}

/*
    Function to delete a table
 */
function deleteTable(tableId) {
    var tableIndex = getTableIndex(tableId);
    timetableStorage.splice(tableIndex, 1);
    updateLocalForage();

    // Check if the active table is deleted
    if (activeTable.id == tableId) {
        if (tableIndex == 0) {
            switchTable(timetableStorage[0].id);
        } else {
            switchTable(timetableStorage[tableIndex - 1].id);
        }
    }

    // Removing the timetable picker item
    $('#tt-picker-dropdown .tt-picker-label')
        .find(`[data-table-id="${tableId}"]`)
        .closest('li')
        .remove();
}

/*
    Function to rename a table
 */
function renameTable(tableId, tableName) {
    var tableIndex = getTableIndex(tableId);
    timetableStorage[tableIndex].name = tableName;
    updateLocalForage();

    // Check if the active table is renamed
    if (activeTable.id == tableId) {
        updatePickerLabel(tableName);
    }

    // Renaming the timetable picker item
    $('#tt-picker-dropdown .tt-picker-label')
        .find(`[data-table-id="${tableId}"]`)
        .text(tableName);
}

/*
    Function to add a table to the timetable picker
 */
function addTableToPicker(tableId, tableName) {
    $('#tt-picker-dropdown').append(
        `<li>
            <table class="dropdown-item">
                <td class="tt-picker-label">
                    <a href="JavaScript:void(0);" data-table-id="${tableId}"
                        >${tableName}</a
                    >
                </td>
                <td>
                    <a
                        class="tt-picker-rename"
                        href="JavaScript:void(0);"
                        data-bs-toggle="modal"
                        data-bs-target="#rename-modal"
                        ><i class="fas fa-pencil-alt"></i
                    ></a
                    ><a
                        class="tt-picker-delete"
                        href="JavaScript:void(0);"
                        data-bs-toggle="modal"
                        data-bs-target="#delete-modal"
                        ><i class="fas fa-trash"></i
                    ></a>
                </td>
            </table>
        </li>`,
    );

    if (timetableStorage.length == 2) {
        $('#tt-picker-dropdown .tt-picker-rename')
            .first()
            .after(
                `<a
                    class="tt-picker-delete"
                    href="JavaScript:void(0);"
                    data-bs-toggle="modal"
                    data-bs-target="#delete-modal"
                    ><i class="fas fa-trash"></i
                ></a>`,
            );
    }
}

/*
    Function to check if slots are clashing
 */
function checkSlotClash() {
    $('#timetable tr td').removeClass('clash');
    $('#course-list tr').removeClass('table-danger');

    const $theoryHours = $('#theory td:not(.lunch)');
    const $labHours = $('#lab td:not(.lunch)');
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    
    let clashData = {};

    days.forEach(day => {
        let scheduledBlocks = [];

        function extractBlocksFromRow(rowId) {
            $(`#${rowId} td.period`).each(function () {
                const $td = $(this);
                // Calculate period index to map to the correct header
                const periodIndex = $td.prevAll('.period').length;
                const headerIndex = periodIndex + 1; // +1 because index 0 is the row label

                $('div', $td).each(function () {
                    const $div = $(this);
                    const isLab = $div.data('is-lab');
                    const dataCourse = $div.data('course');
                    
                    let $header = isLab ? $labHours.eq(headerIndex) : $theoryHours.eq(headerIndex);
                    if (!$header || !$header.data('start') || !$header.data('end')) return;

                    let refDate = new Date(2000, 0, 1);
                    let start = parse($header.data('start'), 'h:mm aa', refDate);
                    if (!isValid(start)) start = parse($header.data('start'), 'HH:mm', refDate);
                    
                    let end = parse($header.data('end'), 'h:mm aa', refDate);
                    if (!isValid(end)) end = parse($header.data('end'), 'HH:mm', refDate);

                    scheduledBlocks.push({
                        start: start,
                        end: end,
                        $td: $td,
                        dataCourse: dataCourse
                    });
                });
            });
        }

        if (window.splitLabs) {
            extractBlocksFromRow(day);
            extractBlocksFromRow(`${day}_lab`);
        } else {
            extractBlocksFromRow(day);
        }

        // Check for time overlaps
        for (let i = 0; i < scheduledBlocks.length; i++) {
            for (let j = i + 1; j < scheduledBlocks.length; j++) {
                let b1 = scheduledBlocks[i];
                let b2 = scheduledBlocks[j];
                
                // If the blocks overlap in time
                let overlapStart = Math.max(b1.start.getTime(), b2.start.getTime());
                let overlapEnd = Math.min(b1.end.getTime(), b2.end.getTime());
                
                if (overlapStart < overlapEnd) {
                    let overlapDuration = overlapEnd - overlapStart;
                    // VTOP intentionally schedules some blocks with exactly 1 minute of overlap 
                    // (e.g. Theory ending at 9:51 and Lab starting at 9:50). We ignore these.
                    if (overlapDuration > 60000) {
                        b1.$td.addClass('clash');
                        b2.$td.addClass('clash');
                        $(`#course-list tr[data-course=${b1.dataCourse}]`).addClass('table-danger');
                        $(`#course-list tr[data-course=${b2.dataCourse}]`).addClass('table-danger');
                        
                        if (!clashData[b1.dataCourse]) clashData[b1.dataCourse] = new Set();
                        if (!clashData[b2.dataCourse]) clashData[b2.dataCourse] = new Set();
                        clashData[b1.dataCourse].add(b2.dataCourse);
                        clashData[b2.dataCourse].add(b1.dataCourse);
                    }
                }
            }
        }
    });
    
    return clashData;
}

window.checkSlotClash = checkSlotClash;

/*
    Function to initialize the timetable
 */
window.initializeTimetable = () => {
    var timetable;
    $('#timetable tr').slice(2).hide();
    $('#timetable tr td:not(:first-child)').remove();
    $('#course-list tbody').empty();
    $('#total-credits').text(0);

    if (window.splitLabs) {
        $('#theory .day').attr('colspan', 2);
        $('#lab .day').attr('colspan', 2);
    } else {
        $('#theory .day').removeAttr('colspan');
        $('#lab .day').removeAttr('colspan');
    }

    if (window.semester === 'winter_freshers_25') {
        timetable = require('../schemas/winter_freshers_25.json');
    } else {
        timetable = require('../schemas/winter_freshers_25.json'); // fallback
    }
    window.activeSchema = timetable;

    var theory = timetable.theory,
        lab = timetable.lab;
    var theoryIndex = 0,
        labIndex = 0;

    while (theoryIndex < theory.length || labIndex < lab.length) {
        const theorySlots = theory[theoryIndex];
        const labSlots = lab[labIndex];

        if (theorySlots && labSlots && !theorySlots.days && !labSlots.days) {
            const rspan = window.splitLabs ? 16 : 9;
            $('#timetable tr:first').append(
                `<td class="lunch" style="width: 8px;" rowspan="${rspan}">L<br />U<br />N<br />C<br />H</td>`,
            );
            ++theoryIndex;
            ++labIndex;

            continue;
        }

        const $theoryHour = $('<td class="theory-hour"></td>');
        const $labHour = $('<td class="lab-hour"></td>');

        if (theorySlots && theorySlots.start && theorySlots.end) {
            $theoryHour.html(
                `${theorySlots.start}<br />to<br />${theorySlots.end}`,
            );
            $theoryHour.data('start', theorySlots.start);
            $theoryHour.data('end', theorySlots.end);
        }

        if (labSlots && labSlots.start && labSlots.end) {
            $labHour.html(`${labSlots.start}<br />to<br />${labSlots.end}`);
            $labHour.data('start', labSlots.start);
            $labHour.data('end', labSlots.end);
        }

        $('#theory').append($theoryHour);
        $('#lab').append($labHour);

        const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
        
        // Recreate day rows if this is the first column loop
        if (theoryIndex === 0 && labIndex === 0) {
            $('#timetable tr').slice(2).remove();
            days.forEach(day => {
                if (window.splitLabs) {
                    $('#timetable tr:last').after(`
                        <tr id="${day}" style="display: none">
                            <td class="day" rowspan="2">${day.toUpperCase()}</td>
                            <td class="day" style="font-size: 0.8em; font-weight: bold; border-left: 1px solid #dee2e6;">THEORY</td>
                        </tr>
                        <tr id="${day}_lab" style="display: none">
                            <td class="day" style="font-size: 0.8em; font-weight: bold; border-left: 1px solid #dee2e6;">LAB</td>
                        </tr>
                    `);
                } else {
                    $('#timetable tr:last').after(`
                        <tr id="${day}" style="display: none">
                            <td class="day">${day.toUpperCase()}</td>
                        </tr>
                    `);
                }
            });
        }

        for (var i = 0; i < days.length; ++i) {
            const day = days[i];

            if (window.splitLabs) {
                const $theoryPeriod = $('<td class="period theory-cell-split"></td>');
                const $labPeriod = $('<td class="period lab-cell-split"></td>');

                let showDay = false;

                if (theorySlots && theorySlots.days && day in theorySlots.days) {
                    const slot = theorySlots.days[day];
                    $theoryPeriod.text(slot);
                    $theoryPeriod.addClass(slot.split('/').join(' '));
                    showDay = true;
                } else {
                    $theoryPeriod.attr('disabled', true);
                    $theoryPeriod.text('-');
                }

                if (labSlots && labSlots.days && day in labSlots.days) {
                    const slot = labSlots.days[day];
                    $labPeriod.text(slot);
                    $labPeriod.addClass(slot.split('/').join(' '));
                    showDay = true;
                } else {
                    $labPeriod.attr('disabled', true);
                    $labPeriod.text('-');
                }

                if (showDay) {
                    $(`#${day}`).show();
                    $(`#${day}_lab`).show();
                }

                $(`#${day}`).append($theoryPeriod);
                $(`#${day}_lab`).append($labPeriod);

            } else {
                const $period = $('<td class="period"></td>');
                let showDay = false;

                if (theorySlots && theorySlots.days && day in theorySlots.days) {
                    const slot = theorySlots.days[day];
                    $period.text(slot);
                    $period.addClass(slot.split('/').join(' '));
                    showDay = true;
                }

                if (labSlots && labSlots.days && day in labSlots.days) {
                    const slot = labSlots.days[day];
                    $period.text(
                        ($period.text() != '' ? $period.text() + ' / ' : '') + slot,
                    );
                    $period.addClass(slot.split('/').join(' '));
                    showDay = true;
                }

                if (!showDay) {
                    $period.attr('disabled', true);
                    $period.text('-');
                } else {
                    $(`#${day}`).show();
                }

                $(`#${day}`).append($period);
            }

        }

        if (theorySlots && !theorySlots.lunch) {
            ++theoryIndex;
        }

        if (labSlots && !labSlots.lunch) {
            ++labIndex;
        }
    }


    /*
        Getting saved data from localforage
     */
    localforage
        .getItem('timetableStorage')
        .then(function (storedValue) {
            timetableStorage = storedValue || timetableStorage;
            activeTable = timetableStorage[0];

            updatePickerLabel(activeTable.name);
            fillPage();

            // Renaming the 'Default Table' option
            $('#tt-picker-dropdown .tt-picker-label a')
                .first()
                .attr('data-table-id', activeTable.id)
                .text(activeTable.name);

            timetableStorage.slice(1).forEach(function (table) {
                addTableToPicker(table.id, table.name);
            });
        })
        .catch(console.error);
};

/*
    Function to add a course to the timetable
 */
window.addCourseToTimetable = (courseData) => {
    courseData.slots.forEach(function (slot) {
        var $divElement = $(
            `<div 
                data-course="course${courseData.courseId}"
                >${courseData.courseCode}${
                courseData.venue != '' ? '-' + courseData.venue : ''
            }</div
            >`,
        );

        if (courseData.slots[0][0] == 'L') {
            $divElement.attr('data-is-lab', 'true').data('is-lab', true);
        } else {
            $divElement.attr('data-is-theory', 'true').data('is-theory', true);
        }

        $(`#timetable tr .${slot}`).addClass('highlight').append($divElement);
    });

    checkSlotClash();
    updateLocalForage();
    if (typeof window.renderDayWiseView === 'function') window.renderDayWiseView();
};

/*
    Function to remove a course from the timetable
 */
window.removeCourseFromTimetable = (course) => {
    $(`#timetable tr td div[data-course="${course}"]`)
        .parent()
        .each(function () {
            if ($(this).children().length != 1) {
                return;
            }

            $(this).removeClass('highlight');
        });

    $(`#timetable tr td div[data-course="${course}"]`).remove();
    checkSlotClash();
    updateLocalForage();
    if (typeof window.renderDayWiseView === 'function') window.renderDayWiseView();
};

/*
    Function to clear the timetable from the body but not delete it's data
 */
window.clearTimetable = () => {
    $('#timetable .period').removeClass('highlight clash');

    if ($('#timetable tr div[data-course]')) {
        $('#timetable tr div[data-course]').remove();
    }
};

/*
    Share Link and Compare Mode Logic
 */
$(() => {
    /* Share Link Generation */
    $('#generate-share-link').on('click', function() {
        if (activeTable.data.length === 0) {
            alert('Your timetable is empty! Add some courses before sharing.');
            return;
        }
        
        // Encode the active table data
        const dataStr = JSON.stringify(activeTable.data);
        const encodedData = btoa(encodeURIComponent(dataStr));
        const shareUrl = window.location.origin + window.location.pathname + '?share=' + encodedData + (window.location.hash || '');
        
        // Copy to clipboard
        navigator.clipboard.writeText(shareUrl).then(() => {
            var $btn = $(this);
            var originalHtml = $btn.html();
            $btn.html('<i class="fas fa-check"></i> Copied!');
            $btn.removeClass('btn-info').addClass('btn-success');
            
            setTimeout(() => {
                $btn.html(originalHtml);
                $btn.removeClass('btn-success').addClass('btn-info');
            }, 2000);
        });
    });

    /* Parse Share Link on Load */
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('share')) {
        try {
            const encodedData = urlParams.get('share');
            const decodedDataStr = decodeURIComponent(atob(encodedData));
            window.sharedTimetableData = JSON.parse(decodedDataStr);
            
            // Show the modal
            var shareModal = new bootstrap.Modal(document.getElementById('share-modal'));
            shareModal.show();
            
            // Remove the ?share parameter from the URL to clean it up
            const cleanUrl = window.location.origin + window.location.pathname + (window.location.hash || '');
            window.history.replaceState({}, document.title, cleanUrl);
        } catch (e) {
            console.error('Failed to parse shared timetable:', e);
            alert('This share link appears to be invalid or corrupted.');
        }
    }

    /* Import Shared Timetable */
    $('#import-share-btn').on('click', function() {
        if (!window.sharedTimetableData) return;
        
        var newTableId = timetableStorage[timetableStorage.length - 1].id + 1;
        var newTableName = 'Shared Table ' + newTableId;

        timetableStorage.push({
            id: newTableId,
            name: newTableName,
            data: window.sharedTimetableData,
            quick: [],
        });

        addTableToPicker(newTableId, newTableName);
        switchTable(newTableId);
        updateLocalForage();
        
        alert('Timetable imported successfully as "' + newTableName + '"!');
        window.sharedTimetableData = null;
    });

    /* Compare Mode Toggle */
    $('#compare-share-btn').on('click', function() {
        if (!window.sharedTimetableData) return;
        
        window.isCompareModeActive = true;
        $('#exit-compare-banner').css('display', 'flex'); // Show the banner
        
        // Render the shared courses
        window.sharedTimetableData.forEach(function(courseData) {
            courseData.slots.forEach(function(slot) {
                var $divElement = $(
                    `<div class="compare-course">${courseData.courseCode} (Friend)</div>`
                );
                $(`#timetable tr .${slot}`).append($divElement);
            });
        });
    });
    
    /* Exit Compare Mode */
    $('#exit-compare-btn').on('click', function() {
        window.isCompareModeActive = false;
        $('#exit-compare-banner').hide();
        $('#timetable .compare-course').remove();
        window.sharedTimetableData = null;
    });
});
