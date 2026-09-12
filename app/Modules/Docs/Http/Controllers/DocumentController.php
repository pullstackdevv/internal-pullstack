<?php

namespace App\Modules\Docs\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Docs\Http\Requests\StoreDocumentRequest;
use App\Modules\Docs\Http\Requests\UpdateDocumentRequest;
use App\Modules\Docs\Models\DocCategory;
use App\Modules\Docs\Models\Document;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class DocumentController extends Controller
{
    public function index(Request $request): Response
    {
        $documents = $this->visibleDocuments($request);

        return Inertia::render('docs/index', [
            'documents' => $documents,
            'nav' => $this->nav($documents),
            'canManage' => $this->canManage($request),
        ]);
    }

    public function show(Request $request, string $slug): Response
    {
        $documents = $this->visibleDocuments($request);
        $document = $documents->firstWhere('slug', $slug);

        abort_if($document === null, 404);

        return Inertia::render('docs/show', [
            'document' => $document,
            'nav' => $this->nav($documents),
            'canManage' => $this->canManage($request),
        ]);
    }

    private function canManage(Request $request): bool
    {
        return $request->user()->isAdmin() || $request->user()->levelFor('docs') === 'manage';
    }

    private function visibleDocuments(Request $request): Collection
    {
        return Document::with('category')
            ->when(! $this->canManage($request), fn ($query) => $query->where('is_published', true))
            ->orderBy('doc_category_id')
            ->orderBy('position')
            ->get();
    }

    private function nav(Collection $documents): array
    {
        return $documents
            ->groupBy(fn (Document $document) => $document->category->name)
            ->map(fn (Collection $docs) => [
                'name' => $docs->first()->category->name,
                'documents' => $docs->map(fn (Document $document) => [
                    'id' => $document->id,
                    'slug' => $document->slug,
                    'title' => $document->title,
                ])->values(),
            ])
            ->values()
            ->all();
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
