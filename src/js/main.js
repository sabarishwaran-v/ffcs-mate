/*
 *  This file contains the events and functions applied to
 *  the document body that is common to all sections or
 *  that doesn't fit into any particular section
 */

import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

import '../scss/main.scss';
import '../scss/course-panel.scss';
import '../scss/timetable.scss';
import '../scss/course-list.scss';

import localforage from 'localforage/dist/localforage';

import './attacher';
import './course-panel';
import './timetable';
import './course-list';
import './daywise';
import * as Utils from './utils';

const lastUpdate = require('../../package.json')['lastUpdate'];

$(function () {
    /*
        Remove focus from quick buttons once clicked
     */
    $('.quick-buttons .btn').on('click', function () {
        $(this).trigger('blur');
    });

    localforage.getItem('splitLabs').then((val) => {
        window.splitLabs = val === null ? true : val; // Default to split labs (VTOP style)
        $('#split-labs-toggle').prop('checked', !window.splitLabs); // checked = merge labs

        localforage.getItem('semester').then((semester) => {
            window.location.hash = semester || '#winter_freshers_25';
            switchSemester();

            $(window).on('hashchange', () => {
                if (window.location.hash === `#${window.semester}`) {
                    return;
                }
                switchSemester();
            });
        });
    });

    $('#split-labs-toggle').on('change', function() {
        window.splitLabs = !$(this).is(':checked'); // If checked, splitLabs = false
        localforage.setItem('splitLabs', window.splitLabs);
        
        initializeTimetable();
    });

    $('.tab-timetable').on('click', function(e) {
        e.preventDefault();
        // Update active styling
        $('.tab-timetable').addClass('active').css('border-bottom', '3px solid var(--bs-primary)').css('color', 'var(--bs-primary)', 'important');
        $('.tab-daywise').removeClass('active').css('border-bottom', 'none').css('color', '#6c757d', 'important');
        
        // Switch views
        $('#timetable-view-container').fadeIn(200);
        $('#daywise-view-container').hide();
        $('#merge-labs-container').show();
        $('#reset-table-btn').show();
        $('#download-table-btn').show();
        $('.sidebar-panel').show(); // Show sidebar
        $('.main-panel').removeClass('col-12').addClass('col-xl-9 col-lg-8'); // Restore main panel width
    });

    $('.tab-daywise').on('click', function(e) {
        e.preventDefault();
        // Update active styling
        $('.tab-daywise').addClass('active').css('border-bottom', '3px solid var(--bs-primary)').css('color', 'var(--bs-primary)', 'important');
        $('.tab-timetable').removeClass('active').css('border-bottom', 'none').css('color', '#6c757d', 'important');
        
        // Switch views
        $('#timetable-view-container').hide();
        $('#daywise-view-container').fadeIn(200);
        $('#merge-labs-container').hide();
        $('#reset-table-btn').hide();
        $('#download-table-btn').hide();
        $('.sidebar-panel').hide(); // Hide sidebar
        $('.main-panel').removeClass('col-xl-9 col-lg-8').addClass('col-12'); // Expand main panel
        
        if (typeof window.renderDayWiseView === 'function') {
            window.renderDayWiseView();
        }
    });

    Utils.removeTouchHoverCSSRule();
});

/*
    Function to switch campuses
 */
window.switchSemester = () => {
    let hash = window.location.hash.toLowerCase();
    
    $('#semester').text('Winter Semester Freshers 25-26');
    $('#last-update').text('Winter Semester Freshers 25-26');
    window.semester = 'winter_freshers_25';
    window.location.hash = '#winter_freshers_25';

    localforage.getItem('semester').then((semester) => {
        localforage.setItem('semester', window.semester).catch(console.error);

        if (semester && semester != window.semester) {
            localforage
                .removeItem('timetableStorage')
                .then(window.location.reload());
            return;
        }

        getCourses();
        initializeTimetable();
    });
};

/*
    Redirect to the GitHub page when Ctrl + U is clicked
    instead of showing the page source code
 */
document.onkeydown = function (e) {
    if (e.ctrlKey && e.key == 'u') {
        window.open('https://github.com/vatz88/FFCSonTheGo');
        return false;
    } else {
        return true;
    }
};

/*
    Function to clear all sections
 */
window.resetPage = () => {
    clearPanel();
    clearTimetable();
    clearCourseList();
};

/*
    Prompt add to home screen
 */
window.addEventListener('beforeinstallprompt', (e) => {
    ga('send', {
        hitType: 'event',
        eventCategory: 'A2H',
        eventAction: 'Seen',
        eventLabel: `A2H Shown`,
    });

    e.userChoice.then((choiceResult) => {
        ga('send', {
            hitType: 'event',
            eventCategory: 'A2H',
            eventAction: 'click',
            eventLabel: `A2H ${choiceResult.outcome}`,
        });
    });
});
