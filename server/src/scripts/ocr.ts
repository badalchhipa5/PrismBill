// External dependencies
import { createWorker } from 'tesseract.js';

// Internal dependencies
import { getDirectoryDetails } from '../../utils/dirname';

const { __dirname, path } = getDirectoryDetails(import.meta.url);

async function runOcr(imagePath: string) {
    const worker = await createWorker('eng');

    const { data } = await worker.recognize(imagePath, {}, { blocks: true });

    const lines = [];

    for (const block of data.blocks ?? []) {
        for (const paragraph of block.paragraphs ?? []) {
            for (const line of paragraph.lines ?? []) {
                lines.push({
                    text: line.text.trim(),
                    confidence: line.confidence,
                });
            }
        }
    }
    await worker.terminate();
}

runOcr(
    'https://wisdomquotes.b-cdn.net/wp-content/uploads/famous-quotes-are-result-have-thought-buddha-wisdom-quotes.webp'
);
runOcr(path.join(__dirname, 'r1.jpg'));
