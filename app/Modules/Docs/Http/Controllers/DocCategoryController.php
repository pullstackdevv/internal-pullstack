<?php

namespace App\Modules\Docs\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Docs\Http\Requests\StoreDocCategoryRequest;
use App\Modules\Docs\Http\Requests\UpdateDocCategoryRequest;
use App\Modules\Docs\Models\DocCategory;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class DocCategoryController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('docs/categories/index', [
            'categories' => DocCategory::withCount('documents')->orderBy('position')->get(),
        ]);
    }

    public function store(StoreDocCategoryRequest $request): RedirectResponse
    {
        DocCategory::create($request->validated());

        return redirect()->route('doc-categories.index');
    }

    public function update(UpdateDocCategoryRequest $request, DocCategory $docCategory): RedirectResponse
    {
        $docCategory->update($request->validated());

        return redirect()->route('doc-categories.index');
    }

    public function destroy(DocCategory $docCategory): RedirectResponse
    {
        $docCategory->delete();

        return redirect()->route('doc-categories.index');
    }
}
