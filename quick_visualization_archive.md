# Quick Visualization Feature Archive

## `src/index.html` Snippets

### Button

```html
                    <button
                        id="quick-toggle"
                        class="btn btn-warning ms-1 me-1"
                        type="button"
                    >
                        <i class="fas fa-eye"></i>
                        <span>&nbsp;&nbsp;Enable Quick Visualization</span>
                    </button>
```

### Morning Slots Container

```html
        <!-- Quick selection tiles - Morning slots -->
        <div
            class="container-sm my-2 quick-buttons noselect"
            style="display: none"
        >
            <div><table></table></div>
        </div>
        <!-- End of quick selection tiles -->
```

### Afternoon Slots Container

```html
        <!-- Quick selection tiles - Evening slots -->
        <div
            class="container-sm my-2 quick-buttons noselect"
            style="display: none"
        >
            <div><table></table></div>
        </div>
        <!-- End of quick selection tiles -->
```

## `src/js/main.js` Snippet

```javascript
    $('#quick-toggle').on('click', function() {
        if ($('.quick-buttons').is(':visible')) {
            $('.quick-buttons').hide();
            $(this).removeClass('btn-danger');
            $(this).addClass('btn-warning');
            $(this).find('span').html('&nbsp;&nbsp;Enable Quick Visualization');
        } else {
            $('.quick-buttons').show();
            $(this).removeClass('btn-warning');
            $(this).addClass('btn-danger');
            $(this).find('span').html('&nbsp;&nbsp;Disable Quick Visualization');
        }
    });
```

## `src/js/timetable.js` Snippet (inside `initializeTimetable()`)

```javascript
// At the top of initializeTimetable:
    var $quickButtons = $('.quick-buttons').eq(0); // Morning slot quick buttons

// Inside the `while` loop for slots, handling lunch:
            $quickButtons = $('.quick-buttons').eq(1); // Afternoon slot quick buttons

// At the very end of initializeTimetable(), after rendering the grid:
    const renderQuickButtonsRow = (slots, $table) => {
        const $row = $('<tr></tr>');
        slots.forEach((slot) => {
            $row.append(`
                <td class="btn btn-sm text-center quick-button ${slot}-tile"
                    data-slot="${slot}"
                >
                    ${slot}
                </td>
            `);
        });
        $table.append($row);
    };

    $('.quick-buttons table').empty();
    renderQuickButtonsRow(['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1'], $('.quick-buttons table').eq(0));
    renderQuickButtonsRow(['TA1', 'TB1', 'TC1', 'TE1', 'TF1', 'TG1'], $('.quick-buttons table').eq(0));
    renderQuickButtonsRow(['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2'], $('.quick-buttons table').eq(1));
    renderQuickButtonsRow(['TA2', 'TB2', 'TC2', 'TD2', 'TE2', 'TF2', 'TG2'], $('.quick-buttons table').eq(1));

    $('.quick-button').on('click', function () {
        if (typeof activeTable !== 'undefined') {
            const slot = $(this).data('slot');
            const [row, column] = window.courseList[slot].location;

            if (!$(this).hasClass('highlight')) {
                activeTable.quick = activeTable.quick.filter(
                    (el) => el[0] != row || el[1] != column,
                );
            } else {
                activeTable.quick.push([row, column]);
            }

            if ($(`#timetable .${slot}`).not('.highlight').length == 0) {
                $(`.quick-buttons .${slot}-tile`).addClass('highlight');
            } else {
                $(`.quick-buttons .${slot}-tile`).removeClass('highlight');
            }

            updateLocalForage();
        }
    });
```
