/**
 * Test script for Instagram comment scraper
 * 
 * Usage:
 *   npm run test-scraper <POST_URL or POST_CODE> [TARGET_COUNT]
 * 
 * Examples:
 *   npm run test-scraper https://www.instagram.com/p/CODE/ 2000
 *   npm run test-scraper CODE 2000
 *   npm run test-scraper https://www.instagram.com/p/CODE/
 */

import { InstagramScraper } from './instagram-scraper';
import { log } from '../log';

async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.error('Usage: npm run test-scraper <POST_URL or POST_CODE> [TARGET_COUNT]');
        console.error('Example: npm run test-scraper https://www.instagram.com/p/CODE/ 2000');
        process.exit(1);
    }

    const input = args[0];
    let postUrl = input;
    const targetCount = args[1] ? parseInt(args[1]) : 2000;

    // Convert post code to full URL if needed
    if (!input.startsWith('http')) {
        postUrl = `https://www.instagram.com/p/${input}/`;
    }

    log('='.repeat(60), 'scraper');
    log(`Instagram Comment Scraper Test`, 'scraper');
    log('='.repeat(60), 'scraper');
    log(`Post URL: ${postUrl}`, 'scraper');
    log(`Target Comments: ${targetCount}`, 'scraper');
    log(`Start Time: ${new Date().toISOString()}`, 'scraper');
    log('='.repeat(60), 'scraper');

    let scraper: InstagramScraper | null = null;

    try {
        scraper = new InstagramScraper();
        
        log('\n🚀 Starting scraper...\n', 'scraper');
        
        const startTime = Date.now();
        const result = await scraper.fetchComments(postUrl, targetCount);
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        log('\n' + '='.repeat(60), 'scraper');
        log(`✅ Scraping Complete!`, 'scraper');
        log('='.repeat(60), 'scraper');
        log(`Comments Captured: ${result.comments.length} / ${targetCount}`, 'scraper');
        log(`Capture Rate: ${((result.comments.length / targetCount) * 100).toFixed(1)}%`, 'scraper');
        log(`Duration: ${duration} seconds`, 'scraper');
        log(`End Time: ${new Date().toISOString()}`, 'scraper');

        if (result.postInfo) {
            log(`Post ID: ${result.postInfo.id}`, 'scraper');
        }

        // Sample first few comments
        if (result.comments.length > 0) {
            log('\n📝 Sample Comments:', 'scraper');
            const sampleSize = Math.min(5, result.comments.length);
            for (let i = 0; i < sampleSize; i++) {
                const comment = result.comments[i];
                log(`  ${i + 1}. @${comment.username}: "${comment.text.substring(0, 60)}${comment.text.length > 60 ? '...' : ''}"`, 'scraper');
            }
            if (result.comments.length > 5) {
                log(`  ... and ${result.comments.length - 5} more`, 'scraper');
            }
        }

        // Check if we met the target
        log('\n' + '='.repeat(60), 'scraper');
        if (result.comments.length >= targetCount) {
            log('✅ Target met! All comments captured.', 'scraper');
        } else if (result.comments.length >= targetCount * 0.8) {
            log(`⚠️  Mostly complete (${((result.comments.length / targetCount) * 100).toFixed(0)}%)`, 'scraper');
            log('   This is acceptable for most use cases.', 'scraper');
        } else if (result.comments.length >= targetCount * 0.5) {
            log(`⚠️  Partial capture (${((result.comments.length / targetCount) * 100).toFixed(0)}%)`, 'scraper');
            log('   Consider increasing SCRAPER_MAX_SCROLLS or delays.', 'scraper');
        } else {
            log('❌ Low capture rate. Check logs and consider:', 'scraper');
            log('   - Is the post actually a Giveaway with many comments?');
            log('   - Are you logged in?');
            log('   - Check proxy rotation');
            log('   - Try with SCRAPER_HEADLESS=false to debug');
        }
        log('='.repeat(60), 'scraper');

        // Success exit code
        process.exit(0);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log('\n' + '='.repeat(60), 'scraper');
        log('❌ Scraping Failed!', 'scraper');
        log('='.repeat(60), 'scraper');
        log(`Error: ${errorMessage}`, 'scraper');
        
        if (error instanceof Error && error.stack) {
            log('\nStack trace:', 'scraper');
            log(error.stack, 'scraper');
        }

        log('\nTroubleshooting:', 'scraper');
        log('1. Check that INSTAGRAM_USERNAME and INSTAGRAM_PASSWORD are set', 'scraper');
        log('2. Try deleting .instagram-session.json to force fresh login', 'scraper');
        log('3. Set SCRAPER_HEADLESS=false to see the browser', 'scraper');
        log('4. Check if the post URL is valid', 'scraper');
        log('5. Verify your Instagram account is not blocked', 'scraper');

        log('='.repeat(60), 'scraper');
        
        // Error exit code
        process.exit(1);
    } finally {
        if (scraper) {
            await scraper.close();
        }
    }
}

// Run the test
main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
});
