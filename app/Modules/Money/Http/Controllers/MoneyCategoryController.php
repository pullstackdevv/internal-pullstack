<?php

namespace App\Modules\Money\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Money\Http\Requests\StoreMoneyCategoryRequest;
use App\Modules\Money\Http\Requests\UpdateMoneyCategoryRequest;
use App\Modules\Money\Models\MoneyCategory;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class MoneyCategoryController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('money/categories/index', [
            'categories' => MoneyCategory::withCount('transactions')->orderBy('kind')->orderBy('name')->get(),
        ]);
    }

    public function store(StoreMoneyCategoryRequest $request): RedirectResponse
    {
        MoneyCategory::create($request->validated());

        return redirect()->route('money.categories.index');
    }

    public function update(UpdateMoneyCategoryRequest $request, MoneyCategory $category): RedirectResponse
    {
        $category->update($request->validated());

        return redirect()->route('money.categories.index');
    }

    public function destroy(MoneyCategory $category): RedirectResponse
    {
        $category->delete();

        return redirect()->route('money.categories.index');
    }
}
