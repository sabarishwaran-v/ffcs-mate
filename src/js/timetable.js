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

    // Re-apply compare mode overlay if active
    if (typeof window.renderCompareTable === 'function') {
        window.renderCompareTable();
    }
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

    const $theoryStartHours = $('#theory-start td:not(.day)');
    const $theoryEndHours = $('#theory-end td:not(.day)');
    const $labStartHours = $('#lab-start td:not(.day)');
    const $labEndHours = $('#lab-end td:not(.day)');
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    
    let clashData = {};

    days.forEach(day => {
        let scheduledBlocks = [];

        function extractBlocksFromRow(rowId) {
            $(`#${rowId} td.period`).each(function () {
                const $td = $(this);
                // Calculate period index to map to the correct header
                // Since we excluded .day cells in the header selectors, index 0 is the first time slot.
                const headerIndex = $td.prevAll('.period').length;

                $('div:not(.compare-course)', $td).each(function () {
                    const $div = $(this);
                    const isLab = $div.data('is-lab');
                    const dataCourse = $div.data('course');
                    
                    let $headerStart = isLab ? $labStartHours.eq(headerIndex) : $theoryStartHours.eq(headerIndex);
                    let $headerEnd = isLab ? $labEndHours.eq(headerIndex) : $theoryEndHours.eq(headerIndex);
                    
                    if (!$headerStart || !$headerEnd) return;
                    
                    let startTimeStr = $headerStart.data('start');
                    let endTimeStr = $headerEnd.data('end');

                    if (!startTimeStr || !endTimeStr) return;

                    let refDate = new Date(2000, 0, 1);
                    let start = parse(startTimeStr, 'h:mm aa', refDate);
                    if (!isValid(start)) start = parse(startTimeStr, 'HH:mm', refDate);
                    
                    let end = parse(endTimeStr, 'h:mm aa', refDate);
                    if (!isValid(end)) end = parse(endTimeStr, 'HH:mm', refDate);

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
    $('#timetable tr').slice(4).hide();
    $('#timetable tr td:not(.day)').remove();
    $('#course-list tbody').empty();
    $('#total-credits').text(0);

    if (window.semester === 'fall_26_27') {
        timetable = require('../schemas/fall_26_27.json');
    } else if (window.semester === 'winter_freshers_25') {
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
            const $theoryStart = $('<td class="theory-hour" style="background-color: #e2e2e2;"></td>').text('Lunch');
            const $theoryEnd = $('<td class="theory-hour" style="background-color: #e2e2e2;"></td>').text('Lunch');
            const $labStart = $('<td class="lab-hour" style="background-color: #e2e2e2;"></td>').text('Lunch');
            const $labEnd = $('<td class="lab-hour" style="background-color: #e2e2e2;"></td>').text('Lunch');

            $('#theory-start').append($theoryStart);
            $('#theory-end').append($theoryEnd);
            $('#lab-start').append($labStart);
            $('#lab-end').append($labEnd);

            const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
            
            for (var i = 0; i < days.length; ++i) {
                const day = days[i];
                const $theoryPeriod = $('<td class="period theory-cell-split" style="background-color: #e2e2e2; color: #000; font-weight: bold;"></td>').text('Lunch');
                const $labPeriod = $('<td class="period lab-cell-split" style="background-color: #e2e2e2; color: #000; font-weight: bold;"></td>').text('Lunch');
                
                $theoryPeriod.attr('disabled', true);
                $labPeriod.attr('disabled', true);

                $(`#${day}`).append($theoryPeriod);
                $(`#${day}_lab`).append($labPeriod);
            }

            ++theoryIndex;
            ++labIndex;
            continue;
        }

        const $theoryStart = $('<td class="theory-hour"></td>');
        const $theoryEnd = $('<td class="theory-hour"></td>');
        const $labStart = $('<td class="lab-hour"></td>');
        const $labEnd = $('<td class="lab-hour"></td>');

        if (theorySlots && theorySlots.start && theorySlots.end) {
            $theoryStart.html(theorySlots.start);
            $theoryEnd.html(theorySlots.end);
            $theoryStart.data('start', theorySlots.start);
            $theoryEnd.data('end', theorySlots.end);
        } else {
            $theoryStart.html('-');
            $theoryEnd.html('-');
        }

        if (labSlots && labSlots.start && labSlots.end) {
            $labStart.html(labSlots.start);
            $labEnd.html(labSlots.end);
            $labStart.data('start', labSlots.start);
            $labEnd.data('end', labSlots.end);
        } else {
            $labStart.html('-');
            $labEnd.html('-');
        }

        $('#theory-start').append($theoryStart);
        $('#theory-end').append($theoryEnd);
        $('#lab-start').append($labStart);
        $('#lab-end').append($labEnd);

        const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
        
        // Recreate day rows if this is the first column loop
        if (theoryIndex === 0 && labIndex === 0) {
            $('#timetable tr').slice(4).remove();
            days.forEach(day => {
                $('#timetable tr:last').after(`
                    <tr id="${day}" style="display: none">
                        <td class="day" rowspan="2">${day.toUpperCase()}</td>
                        <td class="day" style="font-weight: normal;">THEORY</td>
                    </tr>
                    <tr id="${day}_lab" style="display: none">
                        <td class="day" style="font-weight: normal;">LAB</td>
                    </tr>
                `);
            });
        }

        for (var i = 0; i < days.length; ++i) {
            const day = days[i];

            const $theoryPeriod = $('<td class="period theory-cell-split"></td>');
            const $labPeriod = $('<td class="period lab-cell-split"></td>');
            
            // Add tooltips to empty split periods
            $theoryPeriod.attr('title', 'Double-click to add custom course');
            $labPeriod.attr('title', 'Double-click to add custom course');

            let showDay = false;

            if (theorySlots && theorySlots.days && day in theorySlots.days) {
                const slot = theorySlots.days[day];
                $theoryPeriod.text(slot);
                $theoryPeriod.addClass(slot.split('/').join(' '));
                showDay = true;
            } else {
                $theoryPeriod.attr('disabled', true);
                $theoryPeriod.text('-');
                $theoryPeriod.removeAttr('title');
            }

            if (labSlots && labSlots.days && day in labSlots.days) {
                const slot = labSlots.days[day];
                $labPeriod.text(slot);
                $labPeriod.addClass(slot.split('/').join(' '));
                showDay = true;
            } else {
                $labPeriod.attr('disabled', true);
                $labPeriod.text('--');
                $labPeriod.removeAttr('title');
            }

            if (showDay) {
                $(`#${day}`).show();
                $(`#${day}_lab`).show();
            }

            $(`#${day}`).append($theoryPeriod);
            $(`#${day}_lab`).append($labPeriod);
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

            // Re-apply compare mode overlay if active
            if (typeof window.renderCompareTable === 'function') {
                window.renderCompareTable();
            }
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
            if (typeof window.showPanelError === 'function') window.showPanelError('Your timetable is empty! Add some courses before sharing.');
            else alert('Your timetable is empty! Add some courses before sharing.');
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
    
    const storedShared = sessionStorage.getItem('sharedTimetable');
    if (storedShared) {
        try {
            window.sharedTimetableData = JSON.parse(storedShared);
            window.isCompareModeActive = true;
        } catch (e) {
            sessionStorage.removeItem('sharedTimetable');
        }
    } else if (urlParams.has('share')) {
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
            if (typeof window.showPanelError === 'function') window.showPanelError('This share link appears to be invalid or corrupted.');
            else alert('This share link appears to be invalid or corrupted.');
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
        sessionStorage.setItem('sharedTimetable', JSON.stringify(window.sharedTimetableData));
        window.renderCompareTable();
    });
    
    /* Exit Compare Mode */
    $('#exit-compare-btn').on('click', function() {
        window.isCompareModeActive = false;
        sessionStorage.removeItem('sharedTimetable');
        $('#exit-compare-banner').hide();
        $('#timetable .compare-course').remove();
        window.sharedTimetableData = null;
    });
});

window.renderCompareTable = () => {
    if (!window.isCompareModeActive || !window.sharedTimetableData) return;

    $('#exit-compare-banner').css('display', 'flex'); // Show the banner
    
    // Clear any existing ones first to prevent duplicates
    $('#timetable .compare-course').remove();
    
    // Render the shared courses
    window.sharedTimetableData.forEach(function(courseData) {
        courseData.slots.forEach(function(slot) {
            var $divElement = $(
                `<div class="compare-course">${courseData.courseCode} (Friend)</div>`
            );
            $(`#timetable tr .${slot}`).append($divElement);
        });
    });
};

/*
    Double Click Listener for Custom Courses
*/
$(document).on('dblclick', '#timetable td.period', function() {
    // Check if cell is empty
    if ($(this).has('div').length) return;
    
    // Extract slot name
    const classes = $(this).attr('class').split(' ');
    const slot = classes.find(c => /^[A-Z0-9]+$/.test(c) && c !== 'period' && c !== 'highlight' && c !== 'theory-cell-split' && c !== 'lab-cell-split');
    
    if (slot) {
        // Pre-validate clash for the exact slot clicked
        var testCourseId = 99999;
        var $divElement = $(`<div class="temp-clash-check" data-course="course${testCourseId}">TEST</div>`);
        if (slot[0] == 'L') $divElement.attr('data-is-lab', 'true').data('is-lab', true);
        else $divElement.attr('data-is-theory', 'true').data('is-theory', true);
        $(`#timetable tr .${slot}`).append($divElement);
        
        var clashData = typeof window.checkSlotClash === 'function' ? window.checkSlotClash() : null;
        var myCourseKey = `course${testCourseId}`;
        
        if (clashData && clashData[myCourseKey]) {
            var clashNames = [];
            clashData[myCourseKey].forEach(function(clashingCourseKey) {
                var $clashingDivs = $(`#timetable div[data-course="${clashingCourseKey}"]`).not('.temp-clash-check');
                if ($clashingDivs.length) {
                    var name = $clashingDivs.first().text().split('-')[0];
                    if (!clashNames.includes(name)) clashNames.push(name);
                    
                    var $cell = $clashingDivs.parent();
                    $cell.addClass('clash-shake');
                    setTimeout(() => $cell.removeClass('clash-shake'), 400);
                }
            });
            
            $('.temp-clash-check').remove();
            if (typeof window.checkSlotClash === 'function') window.checkSlotClash();
            
            if (typeof window.showPanelError === 'function') {
                window.showPanelError("Cannot select slot. " + slot + " is clashing with " + (clashNames.join(', ') || "another overlapping course"));
            } else {
                alert("Cannot select slot. " + slot + " is clashing with " + (clashNames.join(', ') || "another overlapping course"));
            }
            return;
        }
        
        $('.temp-clash-check').remove();
        if (typeof window.checkSlotClash === 'function') window.checkSlotClash();

        const $select = $('#customCourseSlot');
        $select.empty();
        
        const options = getSlotOptions(slot);
        options.forEach(opt => {
            $select.append(`<option value="${opt}">${opt}</option>`);
        });
        
        // Find if the clicked slot itself is in the options (it should be) and select it?
        // Wait, "first slot choosing is necessary directly show them first", implies the highest credit combo should be first, which it is. 
        // We will default select the highest credit combo (the first one).
        $select.prop('selectedIndex', 0);
        
        $('#customCourseCode').val('');
        $('#customCourseTitle').val('');
        $('#customCourseCredits').val(calculateCustomCredits($select.val()));
        
        var myModal = new bootstrap.Modal(document.getElementById('customCourseModal'));
        myModal.show();
    }
});

function getSlotOptions(slot) {
    if (slot.startsWith('L')) {
        let n = parseInt(slot.substring(1));
        if (isNaN(n)) return [slot];
        
        let blockStart = Math.floor((n - 1) / 6) * 6 + 1;
        let blockEnd = blockStart + 5;
        
        let options = [];
        
        if (n % 2 === 0) {
            if (n - 1 >= blockStart) options.push(`L${n-1}+L${n}`);
            if (n + 1 <= blockEnd) options.push(`L${n}+L${n+1}`);
        } else {
            if (n + 1 <= blockEnd) options.push(`L${n}+L${n+1}`);
            if (n - 1 >= blockStart) options.push(`L${n-1}+L${n}`);
        }
        
        options.push(slot);
        return options;
    }
    
    let baseMatch = slot.match(/[A-G][1-2]$/);
    if (!baseMatch) return [slot];
    
    let X = baseMatch[0];
    let char = X[0];
    
    let options = [];
    
    if (char !== 'G') {
        options.push(`${X}+S${X}+T${X}`);
        if (['D', 'E', 'F'].includes(char)) {
            options.push(`${X}+T${X}+T${char}${X}`);
        }
    }
    
    options.push(`${X}+T${X}`);
    if (['D', 'E', 'F'].includes(char)) {
        options.push(`${X}+T${char}${X}`);
    }
    
    options.push(`${X}`);
    
    options.push(`T${X}`);
    if (['D', 'E', 'F'].includes(char)) {
        options.push(`T${char}${X}`);
    }
    
    let finalOptions = [...new Set([...options, slot])];
    return finalOptions;
}

function calculateCustomCredits(slotString) {
    if (!slotString) return 0;
    const slots = slotString.toUpperCase().split('+').map(s => s.trim()).filter(s => s);
    if (slots.length === 0) return 0;
    
    if (slots.some(s => /^L\d+/.test(s))) {
        return Math.max(1, Math.floor(slots.length / 2));
    }
    
    if (slots.length === 3) return 4;
    if (slots.length === 2) return 3;
    if (slots.length === 1) {
        if (/^[TS]\w+/.test(slots[0])) return 1;
        return 2;
    }
    return slots.length;
}

$(document).on('change', '#customCourseSlot', function() {
    $('#customCourseCredits').val(calculateCustomCredits($(this).val()));
});

$(document).on('input', '#customCourseTitle', function() {
    $(this).val($(this).val().replace(/\b\w/g, c => c.toUpperCase()));
});

$(document).on('click', '#addCustomCourseBtn', function() {
    const slotString = $('#customCourseSlot').val().toUpperCase().trim();
    const courseCode = $('#customCourseCode').val().toUpperCase().trim();
    const courseTitle = $('#customCourseTitle').val().trim();
    const credits = $('#customCourseCredits').val() || "0";
    
    if (!courseCode || !courseTitle || !slotString) {
        if (typeof window.showPanelError === 'function') window.showPanelError("Please enter a Slot, Course Code, and Title.");
        else alert("Please enter a Slot, Course Code, and Title.");
        return;
    }
    
    const slots = slotString.split('+').map(s => s.trim()).filter(s => s);
    
    // Generate new ID
    var courseId = 0;
    if (activeTable.data.length != 0) {
        var lastAddedCourse = activeTable.data[activeTable.data.length - 1];
        courseId = lastAddedCourse.courseId + 1;
    }
    
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
        if (typeof window.showPanelError === 'function') window.showPanelError(`Course <strong>${courseCode}</strong> (${componentType}) is already in your timetable.`);
        else alert(`Course ${courseCode} (${componentType}) is already in your timetable.`);
        return;
    }
    
    var courseData = {
        courseId: courseId,
        courseCode: courseCode,
        courseTitle: courseTitle,
        faculty: "Custom",
        slots: slots,
        venue: "-",
        credits: credits,
        isProject: "No",
    };
    
    // Clashing logic: Pre-validate by temporarily injecting into the DOM
    slots.forEach(function (slot) {
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
                
                var $cell = $clashingDivs.parent();
                $cell.addClass('clash-shake');
                setTimeout(() => $cell.removeClass('clash-shake'), 400);
            }
        });

        if (typeof window.showPanelError === 'function') {
            window.showPanelError("Cannot add course. Slot(s) " + slots.join('+') + " clashing with " + (clashNames.join(', ') || "another overlapping course"));
        } else {
            alert("Cannot add course. Slot(s) " + slots.join('+') + " clashing with " + (clashNames.join(', ') || "another overlapping course"));
        }
        
        $('.temp-clash-check').remove();
        if (typeof window.checkSlotClash === 'function') window.checkSlotClash();
        return;
    }
    
    $('.temp-clash-check').remove();
    if (typeof window.checkSlotClash === 'function') window.checkSlotClash();
    
    // Success - Add course
    activeTable.data.push(courseData);
    addCourseToCourseList(courseData);
    addCourseToTimetable(courseData);
    
    var totalCredits = 0;
    activeTable.data.forEach(function (el) {
        totalCredits += Number(el.credits);
    });
    $('#total-credits').text(totalCredits);
    
    bootstrap.Modal.getInstance(document.getElementById('customCourseModal')).hide();
});
