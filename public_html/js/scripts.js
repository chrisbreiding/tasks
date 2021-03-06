$(document).ready(function () {

	var util = {

		updateTask : function (data, $parentRow) {
			if ($parentRow) {
				$parentRow.addClass('saving');
			}
			$.ajax({
				type	: 'POST',
				url		: '/tasks/update',
				data	: data,
				success	: function ( data, textStatus, jqXHR ) {

					if ($parentRow) {
						$('<div class="saved">Saved</div>').appendTo($parentRow).fadeIn('slow', function () {
							$parentRow.removeClass('saving');
							$('.saved').delay(500).fadeOut('slow', function () {
								$('.saved').remove();
							});
						});
					}

				}
			});
		},

		pad : function (num) {
			var paddedNum = '0' + num;
			return paddedNum.substring(paddedNum.length - 2);
		},

		toMysql : function (date) {
			return date.getFullYear() + "-" + util.pad(1 + date.getMonth()) + "-" + util.pad(date.getDate());
		},

		updateOrder : function ($categoryDiv) {

			$.ajax({
				type: 'POST',
				url: '/tasks/sort_tasks',
				data: $categoryDiv.sortable('serialize')
			});

		},

		handleLink : function ($editBar) {

			var $parentRow = $editBar.closest('.task-row'),
				data,
				$linkHref = $('#link-href'),
				linkHrefVal = $linkHref.val() !== $linkHref.attr('title') ? $linkHref.val() : '',
				$linkText = $('#link-text'),
				linkTextVal = $linkText.val() !== $linkText.attr('title') ? $linkText.val() : linkHrefVal;

			$('#link-editor').remove();

			if ( linkHrefVal ) { // If there's actually something to link
				linkHrefVal = linkHrefVal.match(/^https?:\/\//) ? linkHrefVal : 'http://' + linkHrefVal;
				data = {
					id			: $parentRow.data('id'),
					link_text	: linkTextVal,
					link_href	: linkHrefVal
				};
				util.updateTask(data, $parentRow);
				if (!$parentRow.hasClass('linked')) {
					$editBar.find('.linker').before('<a class="linker break-link" href="#">Remove Link</a>');
					$parentRow.addClass('linked');
				} else {
					$editBar.find('.link').remove(); // Remove previous link
				}
				$('<a class="link" href="' + linkHrefVal + '" target="_blank">' + linkTextVal+ '</a>').appendTo($editBar);
			} else {
				$parentRow.removeClass('linked');
			}

			$parentRow.removeClass('editing-link').find('.task').focus();

		}

	};

	util.date = (function () {

		var date_seg = window.location.href.match(/[0-9\-]+$/),
			date = date_seg ? date_seg[0] : util.toMysql( new Date() );

		return date;

	}());

	// Initial actions
	var load = (function () {

		function resizeBodyHeight () {
			$(document.body).height($(window).height());
		}

		function documentClick () {
			$('.date-changer').hide();	// Hide date changers
			$('.link:hidden').show();	// Reveal any hidden links

			if ($('#link-editor').length) {	// If there's an open link editor
				var $editBar = $('#link-editor').closest('.edit-bar');
				util.handleLink($editBar);
			}

			$('.task-row').removeClass('edit-bar-open'); // Close open edit bars
		}

		function categoryClick (e) {
			e.stopPropagation();
		}

		return {

			init : function () {

				// Expand height of body for when clicking outside of tasks
				resizeBodyHeight();
				$(window).resize(resizeBodyHeight);

				// Give empty categories the "empty" class
				$('.category').each(function () {
					var $this = $(this);
					if ($this.find('.task-row').length < 1) {
						$this.addClass('empty');
					}
				});

				// When clicking outside tasklist
				$(document.body).click(documentClick);

				// Stop clicks inside category divs from bubbling up
				$('.category').click(categoryClick);

			}

		};

	}());

	// Top date picker
	var datePicker = (function () {

		var $datePick = $('#date-pick');

		return {

			init : function () {

				$('#date-input').datepicker({

					showOn			: 'button',
					buttonText		: 'Pick Date',
					buttonImageOnly	: true,
					buttonImage		: '/ui/date-picker.png',
					dateFormat		: 'yy-mm-dd',
					defaultDate		: util.date,
					gotoCurrent		: true,
					maxDate			: 0,
					nextText		: 'Next Month',
					prevText		: 'Previous Month',
					beforeShow		: function () {
										$datePick.addClass('date-picker-open');
									},
					onSelect		: function (dateText, inst) {
										window.location = '/tasks/completed/' + dateText;
									},
					onClose			: function () {
										$datePick.removeClass('date-picker-open');
									}
				});

				$('#ui-datepicker-div').appendTo($datePick);

			}

		};

	}());

	// Create task
	var createTask = (function () {

		var dragToCreate = {
			connectToSortable : '.task-list',
			helper : function () {
				return $('<div class="task-row ui-dropper"><div class="completed"><span></span><input class="task" /></div></div>')[0];
			},
			revert : 'invalid',
			distance : 20,
			cursorAt : {
				top: 25,
				left: 15
			},
			start : function () {
				$('.task-list .ui-draggable').remove();
			},
			stop : function () {

				$dropped = $('.task-list .ui-placeholder');

				if($dropped.length) { // ensure it's being dropped in a category

					$.ajax({
						type: 'POST',
						url: '/tasks/create',
						data: {
							'task'			: '',
							'category_id'	: $dropped.closest('.category').data('cat-id'),
							'link_text'		: '',
							'link_href'		: '',
							'important'		: 0
						},
						success: function (data, textStatus, jqXHR) {

							$dropped.after(data);

							$('.newly-created')
								.removeClass('newly-created')
								.find('.task')
									.focus();

						}
					});

				}

			}
		};

		function clickToCreate (e) {

			var $createTask = $('.create-task');

			e.preventDefault();

			if ($createTask.hasClass('creating-task')) {
				$createTask.removeClass('creating-task');
				$('#task-creator').remove();
			} else {
				$.get('/tasks/task_creator', function (data, textStatus, jqXHR) {

					$createTask.append(data).addClass('creating-task');
					$('#task').focus();

				});
			}

		}

		function linkFocus (e) {

			var $this = $(this),
				thisVal = $this.val();
			if (thisVal === $this.attr('title')) {
				$this.val('');
			}

		}

		function linkBlur (e) {

			var $this = $(this),
				thisVal = $this.val();

			if (thisVal === '') {

				$this.val($this.attr('title'));
				$this.removeClass('has-text');

			} else {

				$this.addClass('has-text');

			}

		}

		function toggleImportance (e) {

			e.preventDefault();
			$('#task-creator').toggleClass('important');

		}

		function cancel (e) {

			e.preventDefault();
			$('.create-task').removeClass('creating-task');
			$('#task-creator').hide().remove();

		}

		function save (e) {
			e.preventDefault();

			var category = $('#categories').val(),
				$categoryDiv = $('#cat-' + category),
				$taskList = $categoryDiv.find('.task-list'),
				$linkText = $('#create-link-text'),
				linkText = '',
				$linkHref = $('#create-link-href'),
				linkHref = $linkHref.val(),
				linkHrefVal = '',
				important = ($('#task-creator').hasClass('important') ? 1 : 0),
				newTaskCallback = function () {
					$categoryDiv.removeClass('empty');
					util.updateOrder($taskList);
					$('.task-list').sortable('refresh');
				};

			if( linkHref && linkHref !== $linkHref.attr('title') ) {
				linkHrefVal = linkHref.match(/^https?:\/\//) ? linkHref : 'http://' + linkHref;
			}

			if( linkHref ) {
				linkText = $linkText.val() !== $linkText.attr('title') ? $linkText.val() : linkHref;
			}

			$.ajax({
				type: 'POST',
				url: '/tasks/create',
				data: {
					'task'			: $('#task').val() || '',
					'category_id'	: category,
					'link_text'		: linkText,
					'link_href'		: linkHrefVal,
					'important'		: important
				},
				success: function (data, textStatus, jqXHR) {

					$('.create-task').removeClass('creating-task');
					$('#task-creator').hide().remove();

					if (important) { // If important, insert it as the first task
						$(data)
							.prependTo($taskList)
							.hide()
							.fadeIn('fast', newTaskCallback);
					} else { // Otherwise, put it at the end
						$(data)
							.appendTo($taskList)
							.hide()
							.fadeIn('fast', newTaskCallback);
					}
				}
			});

		}

		function saveOnEnter (e) {

			e.preventDefault();
			$('#save-task').trigger('click');

		}

		return {

			init : function () {
				// Click or drag add task
				$('#create-task')
					.click(clickToCreate)
					.draggable(dragToCreate);

				$('.create-task')
					// Focus on link input
					.delegate( '.creator-edit-bar input', 'focus', linkFocus )
					// Blur from link input
					.delegate( '.creator-edit-bar input', 'blur', linkBlur )
					// Toggle Importance
					.delegate( '.flagger', 'click', toggleImportance )
					// Cancel Task Creation
					.delegate('#cancel-task', 'click', cancel )
					// Create a new task
					.delegate('#save-task', 'click', save )
					// Add task on enter
					.delegate('#submit-task', 'click', saveOnEnter);
			}

		};

	}());

	// Task actions
	var tasks = (function () {

		function taskFocus (e) {

			$('.edit-bar-open').removeClass('edit-bar-open editing-link');
			$('#link-editor').remove();
			$(this).closest('.task-row').addClass('edit-bar-open');

		}

		function toggleCompletion (e) {

			var $this = $(this),
				$parentRow = $this.closest('.task-row'),
				isNowChecked = $this.hasClass('checked'),
				data = {
					id				: $parentRow.data('id'),
					completed		: (isNowChecked ? 0 : 1),
					date_completed	: (isNowChecked ? 'NULL' : util.toMysql(new Date())),
					task			: $parentRow.find('.task').val(),
					important		: 0
				};

			e.preventDefault();
			util.updateTask(data, $parentRow);
			$parentRow.fadeOut('slow', function (){
				$parentRow.remove();
			});

		}

		function updateOnChange (e) {

			var $this = $(this);

			e.preventDefault();

			util.updateTask({
				id		: $this.closest('.task-row').data('id'),
				task	: $this.val()
			}, $this.closest('.task-row'));

		}

		function updateOnEnter (e) {

			var $parentRow = $(this).closest('.task-row');

			e.preventDefault();

			util.updateTask({
				id		: $parentRow.data('id'),
				task	: $parentRow.find('.task').val()
			}, $parentRow);

		}

		function toggleImportance (e) {

			var $parentRow = $(this).closest('.task-row');

			e.preventDefault();
			$parentRow.toggleClass('important');
			util.updateTask({
				id			: $parentRow.data('id'),
				important	: $parentRow.hasClass('important') ? 1 : 0
			}, $parentRow);

		}

		function deleteFirstClick (e) {

			e.preventDefault();
			$('.confirm-delete').hide();
			$('.delete').show();
			$(this).hide().siblings('.confirm-delete').show();

		}

		function deleteSecondClick (e) {

			var $this = $(this),
				url = $this.attr('href'),
				$parentRow = $this.closest('.task-row');

			e.preventDefault();

			if ($parentRow.siblings('.task-row').length === 0) {
				$parentRow.closest('.category').addClass('empty');
			}

			$.ajax({
				url: url,
				success: function (data, textStatus, jqXHR) {

					if( jqXHR.status == 302 ) {
						window.location.reload();
					}

					$parentRow.fadeOut('slow', function () {
						$parentRow.remove();
					});

				}
			});

		}

		function cancelDelete () {

			$('.confirm-delete').hide();
			$('.delete').show();

		}

		function addLink (e) {

			var $editBar = $(this).closest('.edit-bar'),
				$parentRow = $editBar.closest('.task-row'),
				$thisLink,
				thisLinkText = 'Label',
				thisLinkHref = 'URL',
				editorClass = '',
				editor;

			e.preventDefault();

			if ($parentRow.hasClass('editing-link')) { // Link is being edited, save and display it

				util.handleLink($editBar);

			} else { // Bring up editor

				$('#link-editor').remove();

				if ($parentRow.hasClass('linked')) { // Link is present, populate editor values
					$thisLink = $editBar.find('.link').hide();
					thisLinkText = $thisLink.text();
					thisLinkHref = $thisLink.attr('href');
					editorClass = 'has-text';
				}

				editor = [
					'<form id="link-editor" accept-charset="utf-8" method="post" action="http://chrisbreiding.com/tasks/update">',
						'<input type="text" id="link-text" class="' + editorClass + '" value="' + thisLinkText + '" title="Label" />',
						'<input type="text" id="link-href" class="' + editorClass + '" value="' + thisLinkHref + '" title="URL" />',
						'<input type="submit" id="save-link" value="Save Link">',
					'</form>'
				];
				$(editor.join('')).appendTo($editBar);
				$parentRow.addClass('editing-link');

			}

		}

		function linkFocus () {

			var $this = $(this),
				thisVal = $this.val();
			if (thisVal === $this.attr('title')) {
				$this.val('');
			}

		}

		function linkBlur () {

			var $this = $(this),
				thisVal = $this.val();

			if (thisVal === '') {

				$this.val($this.attr('title'));
				$this.removeClass('has-text');

			} else {

				$this.addClass('has-text');

			}

		}

		function saveLinkOnEnter (e) {

			var $editBar = $(this).closest('.edit-bar');
			e.preventDefault();
			util.handleLink($editBar);

		}

		function removeLink (e) {

			var $this = $(this),
				$editBar = $this.closest('.edit-bar'),
				$parentRow = $editBar.closest('.task-row');

			e.preventDefault();
			util.updateTask({
				id			: $parentRow.data('id'),
				link_text	: '',
				link_href	: ''
			}, $parentRow);
			$('#link-editor').remove();
			$editBar.find('.link').remove();
			$this.remove();
			$parentRow.removeClass('linked editing-link').find('.task').focus();

		}

		function changeDate (e) {

			var $this = $(this),
				$parentRow = $this.closest('.task-row');
			e.preventDefault();
			e.stopPropagation();
			$('.task-row').css('z-index', 10);
			$parentRow.css('z-index', 50);
			$this.siblings('.date-changer').fadeIn();

		}

		return {

			init : function () {

				$('.task-list')
					// Focus on task
					.delegate( '.task', 'focus', taskFocus )
					// Check or uncheck completion
					.delegate( '.check', 'click', toggleCompletion )
					// Update on change
					.delegate( '.task', 'change', updateOnChange )
					// Update on enter
					.delegate( '.save-task', 'click', updateOnEnter )
					// Toggle importance
					.delegate( '.flagger', 'click', toggleImportance )
					// Click delete circle -> bring up confirm delete button
					.delegate( '.delete', 'click', deleteFirstClick )
					// Confirm delete
					.delegate( '.confirm-delete', 'click', deleteSecondClick )
					// Cancel delete by focusing on task input
					.delegate( '.task', 'focus', cancelDelete )
					// Click add link
					.delegate( '.add-link', 'click', addLink )
					// Focus on link editor input
					.delegate( '#link-editor input', 'focus', linkFocus )
					// Blur from link editor input
					.delegate( '#link-editor input', 'blur', linkBlur )
					// Submit link editor on enter
					.delegate( '#save-link', 'click', saveLinkOnEnter )
					// Remove link
					.delegate( '.break-link', 'click', removeLink )
					// Order the tasks
					.sortable({
						placeholder : 'ui-placeholder',
						handle		: '.handle',
						connectWith : '.task-list',
						revert		: 250,
						remove		: function (event, ui) {
										var $this = $(this);
										if (!$this.find('.task-row').length) {
											$this.closest('.category').addClass('empty');
										}
									},
						update		: function (event, ui) {
										var $this = $(this),
											$closestCategory = $this.closest('.category');
										if ($closestCategory[0] === ui.item.closest('.category')[0]) {
											util.updateOrder($this);
											util.updateTask({
												id			: ui.item.data('id'),
												task		: ui.item.find('.task').val(),
												category_id : $closestCategory.data('cat-id')
											}, ui.item);
											$closestCategory.removeClass('empty');
										}
									},
						stop		: function (event, ui) {
										ui.item.find('.task').focus(); // Re-focus the input
									}
					});

				// Completed task date picker
				$('.date-changer').datepicker({
					dateFormat	: 'yy-mm-dd',
					defaultDate : util.date,
					gotoCurrent : true,
					maxDate		: 0,
					nextText	: 'Next Month',
					prevText	: 'Previous Month',
					onSelect	: function (dateText, inst) {
									var $parentRow = $(this).closest('.task-row');

									if ( dateText !== util.date ) {
										util.updateTask({
											id				: $parentRow.data('id'),
											date_completed	: dateText
										});
										$parentRow.fadeOut('slow', function () {
											$parentRow.remove();
										});

									}
								}

				});
				$('.date-change > a').click( changeDate );

			}

		};

	}());

	var bootstrap = function () {

		load.init();

		datePicker.init();

		createTask.init();

		tasks.init();

	};

	// Let her rip!
	bootstrap();

});