<?php

/**
 * Fired when the plugin is uninstalled.
 *
 * When populating this file, consider the following flow
 * of control:
 *
 * - This method should be static
 * - Check if the $_REQUEST content actually is the plugin name
 * - Run an admin referrer check to make sure it goes through authentication
 * - Verify the output of $_GET makes sense
 * - Repeat with other user roles. Best directly by using the links/query string parameters.
 * - Repeat things for multisite. Once for a single site in the network, once sitewide.
 *
 * This file may be updated more in future version of the Boilerplate; however, this is the
 * general skeleton and outline for how the file should work.
 *
 * For more information, see the following discussion:
 * https://github.com/tommcfarlin/WordPress-Plugin-Boilerplate/pull/123#issuecomment-28541913
 *
 * @link       https://optimocha.com
 * @since      4.0.0
 *
 * @package    Speed_Booster_Pack
 */

// If uninstall not called from WordPress, then exit.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	die;
}

if ( ! defined( 'SBP_CACHE_DIR' ) ) {
	define( 'SBP_CACHE_DIR', WP_CONTENT_DIR . '/cache/speed-booster/' );
}

if ( ! defined( 'SBP_LOCALIZED_SCRIPT_DIR' ) ) {
	define( 'SBP_LOCALIZED_SCRIPT_DIR', WP_CONTENT_DIR . '/uploads/speed-booster/' );
}

delete_option( 'sbp_options' );
delete_option( 'sbp_notice_error' );
delete_option( 'sbp_transient_error' );
@rmdir( SBP_CACHE_DIR );
@rmdir( SBP_LOCALIZED_SCRIPT_DIR );

// Clear htaccess
global $wp_filesystem;

require_once( ABSPATH . '/wp-admin/includes/file.php' );
WP_Filesystem();

$htaccess_file_path = get_home_path() . '/.htaccess';

if ( $wp_filesystem->exists( $htaccess_file_path ) ) {
	global $wp_filesystem;

	require_once( ABSPATH . '/wp-admin/includes/file.php' );

	$current_htaccess = $wp_filesystem->get_contents( $htaccess_file_path );

	if ( $wp_filesystem->exists( $htaccess_file_path ) ) {
		$current_htaccess = trim( $wp_filesystem->get_contents( $htaccess_file_path ) );
		$current_htaccess = preg_replace( '/(# BEGIN Speed Booster Pack.*?# END Speed Booster Pack' . PHP_EOL . PHP_EOL . ')/msi', '', $current_htaccess );
	}

	$wp_filesystem->put_contents( get_home_path() . '/.htaccess', $current_htaccess );
}

// Remove SBP Announcements
delete_option( 'sbp_announcements' );
delete_transient('sbp_notice_cache');
delete_transient('sbp_cloudflare_status');
delete_transient('sbp_upgraded_notice');

// Delete user metas
$users = get_users('role=administrator');
foreach($users as $user) {
	delete_user_meta($user->ID, 'sbp_dismissed_notices');
	delete_user_meta($user->ID, 'sbp_dismissed_compat_notices');
}

// TODO: uninstall.php: Also delete the sbp_announcements option and all the other transients & usermeta we put.