<?php

namespace App\Modules\Docs\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Docs\Http\Requests\StoreDocumentRequest;
use App\Modules\Docs\Http\Requests\UpdateDocumentRequest;
use App\Modules\Docs\Models\DocCategory;
use App\Modules\Docs\Models\Document;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DocumentController extends Controller
{
    public function index(Request $request): Response
    {
        $canManage = $request->user()->isAdmin() || $request->user()->levelFor('docs') === 'manage';

        $documents = Document::with('category')
            ->when(! $canManage, fn ($query) => $query->where('is_published', true))
            ->orderBy('doc_category_id')
            ->orderBy('position')
            ->get();

        return Inertia::render('docs/index', [
            'documents' => $documents,
            'canManage' => $canManage,
        ]);
    }

    public function show(Request $request, string $slug): Response
    {
        $canManage = $request->user()->isAdmin() || $request->user()->levelFor('docs') === 'manage';

        $document = Document::where('slug', $slug)
            ->when(! $canManage, fn ($query) => $query->where('is_published', true))
            ->firstOrFail();

        return Inertia::render('docs/show', ['document' => $document]);
    }

    public function create(): Response
    {
        return Inertia::render('docs/create', [
            'categories' => DocCategory::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(StoreDocumentRequest $request): RedirectResponse
    {
        Document::create([
            ...$request->validated(),
            'created_by' => $request->user()->id,
        ]);

        return redirect()->route('documents.index');
    }

    public function edit(Document $document): Response
    {
        return Inertia::render('docs/edit', [
            'document' => $document,
            'categories' => DocCategory::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(UpdateDocumentRequest $request, Document $document): RedirectResponse
    {
        $document->update([
            ...$request->validated(),
            'updated_by' => $request->user()->id,
        ]);

        return redirect()->route('documents.index');
    }

    public function destroy(Document $document): RedirectResponse
    {
        $document->delete();

        return redirect()->route('documents.index');
    }
}
