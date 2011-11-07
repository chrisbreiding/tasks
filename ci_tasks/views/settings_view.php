<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8" />
	<title><?php echo $title; ?></title>
	<link rel="stylesheet" href="<?php echo base_url(); ?>style.css" />
	<link rel="shortcut icon" href="<?php echo base_url(); ?>favicon.ico" />
</head>
<body class="<?php echo $body_class; ?>">

	<div class="container">
		
		<ul class="options-bar">
			<li class="tasks-link"><a title="Return to Tasks" href="/tasks">Return to Tasks</a></li>
			<li class="logout"><a href="/tasks/logout">Log Out</a></li>
		</ul>

		<h1>Settings</h1>
		
		<img id="saving-settings" src="<?php echo base_url(); ?>ui/saving-big.gif" width="32" height="32" alt="" />
		<div id="saved-message">Settings Saved</div>
		
		<div class="section columns-section clearfix">
			
			<div class="settings-header clearfix">
				<h2>Layout</h2>
			</div>
			
			<div class="content">
				
				<ul class="col-select clearfix">
					<li class="col-select-1" data-layout="1">
						<span class="col-inner-1">1</span>
					</li>
					<li class="col-select-2" data-layout="2">
						<span class="col-inner-1">1</span>
						<span class="col-inner-2">2</span>
					</li>
				</ul>
				
			</div>
			
		</div><!-- /.section -->
		
		<div class="section categories-section clearfix">
			
			<div class="settings-header clearfix">
			
				<h2>Categories</h2>
				
				<a id="add-cat" href="#">+</a>
				
				<?php echo form_open('tasks/settings/create_category', array('id' => 'cat-creator', 'class' => 'clearfix')); ?>
				
					<?php echo form_input( 'category', '', 'id="new-cat"' ); ?>
					<?php echo form_submit('submit-cat', 'Save', 'id="submit-cat"'); ?>
					
				<?php echo form_close(); ?>

			</div>
			
			<div class="content clearfix">
				
				<?php foreach($category_data as $task_cols => $categories) { ?>
				
					<ul class="cat-settings-col cat-settings-col-<?php echo $task_cols + 1; ?>" data-col="<?php echo $task_cols + 1; ?>">
					
						<?php include(APPPATH . 'views/_categories.php'); ?>

					</ul><!-- /.col -->
					
				<?php } // end columns foreach ?>
				
			</div>
			
		</div><!-- /.section -->
		
	</div><!-- /.container -->
	
	<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.6.4/jquery.min.js"></script>
	<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.14/jquery-ui.min.js"></script>	
	<script type="text/javascript" src="<?php echo base_url(); ?>js/settings-scripts.js"></script>

</body>
</html>