import React, { useState, useEffect } from 'react';
import { categoryApi } from '../services/api';
import { Category, CreateCategoryRequest } from '../types';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';

const CategoryManagement: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; category: Category | null }>({
        isOpen: false,
        category: null,
    });

    const [formData, setFormData] = useState<CreateCategoryRequest>({
        name: '',
        color: '#10B981',
        isShared: false,
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const fetchedCategories = await categoryApi.getAll();
            setCategories(fetchedCategories);
        } catch (err) {
            setError('カテゴリの取得に失敗しました');
            console.error('Error fetching categories:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                const updatedCategory = await categoryApi.update(editingCategory.id, formData);
                setCategories(categories.map(category => category.id === editingCategory.id ? updatedCategory : category));
            } else {
                const newCategory = await categoryApi.create(formData);
                setCategories([...categories, newCategory]);
            }
            closeModal();
        } catch (err) {
            setError(editingCategory ? 'カテゴリの更新に失敗しました' : 'カテゴリの作成に失敗しました');
            console.error('Error saving category:', err);
        }
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setFormData({ name: category.name, color: category.color, isShared: category.isShared });
        setIsModalOpen(true);
    };

    const handleDelete = async (category: Category) => {
        try {
            await categoryApi.delete(category.id);
            setCategories(categories.filter(c => c.id !== category.id));
            setDeleteDialog({ isOpen: false, category: null });
        } catch (err) {
            setError('カテゴリの削除に失敗しました');
            console.error('Error deleting category:', err);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
        setFormData({ name: '', color: '#10B981', isShared: false });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">🏷️ カテゴリ管理</h1>
                    <p className="text-gray-600 mt-1">支出のカテゴリを登録・管理できます</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn btn-primary btn-lg"
                >
                    <span className="mr-2">➕</span>
                    新しいカテゴリを追加
                </button>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="alert alert-error">
                    {error}
                    <button
                        onClick={() => setError(null)}
                        className="ml-auto text-red-600 hover:text-red-800"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Categories List */}
            {categories.length === 0 ? (
                <div className="card text-center py-12">
                    <div className="text-6xl mb-4">🏷️</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">カテゴリがありません</h3>
                    <p className="text-gray-600 mb-4">最初のカテゴリを追加しましょう</p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn btn-primary"
                    >
                        カテゴリを追加
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {categories.map((category) => (
                        <div
                            key={category.id}
                            className="card card-hover border-l-4"
                            style={{ borderLeftColor: category.color }}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
                                    <div
                                        className="w-4 h-4 rounded-full mr-3"
                                        style={{ backgroundColor: category.color }}
                                    />
                                    {category.name}
                                    {category.isShared && (
                                        <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200 rounded-full">
                                            共通
                                        </span>
                                    )}
                                </h3>
                                <div className="flex space-x-1">
                                    <button
                                        onClick={() => handleEdit(category)}
                                        className="icon-btn text-gray-400 hover:text-primary-600"
                                        title="編集"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => setDeleteDialog({ isOpen: true, category })}
                                        className="icon-btn text-gray-400 hover:text-red-600"
                                        title="削除"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div className="text-sm text-gray-500 space-y-1">
                                <div className="flex items-center">
                                    <span className="mr-2">🎨</span>
                                    <span>{category.color}</span>
                                </div>
                                <div>
                                    作成日: {new Date(category.createdAt).toLocaleDateString('ja-JP')}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingCategory ? 'カテゴリを編集' : '新しいカテゴリを追加'}
                size="sm"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="form-label">カテゴリ名</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="form-input"
                            placeholder="例: 食費"
                            required
                            maxLength={50}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            食費、交通費、娯楽費などのカテゴリ名を入力してください
                        </p>
                    </div>

                    <div>
                        <label className="form-label">カラー</label>
                        <div className="grid grid-cols-5 gap-3 mb-3">
                            {['#10B981', '#3B82F6', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#6B7280', '#14B8A6', '#F97316', '#8142e7'].map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, color })}
                                    className={`w-12 h-12 rounded-lg border-2 transition-all duration-200 ${formData.color === color
                                            ? 'border-primary-500 scale-110 shadow-lg'
                                            : 'border-gray-300 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-400'
                                        }`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                        <input
                            type="color"
                            value={formData.color}
                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                            className="w-full h-12 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                        />
                    </div>

                    <div>
                        <label className="flex items-center space-x-3">
                            <input
                                type="checkbox"
                                checked={formData.isShared}
                                onChange={(e) => setFormData({ ...formData, isShared: e.target.checked })}
                                className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                🤝 共通カテゴリ（折半対象）
                            </span>
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                            チェックすると、このカテゴリの支出は2人で折半する対象として扱われます
                        </p>
                    </div>

                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="btn btn-secondary flex-1"
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary flex-1"
                        >
                            {editingCategory ? '更新' : '追加'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteDialog.isOpen}
                onClose={() => setDeleteDialog({ isOpen: false, category: null })}
                onConfirm={() => deleteDialog.category && handleDelete(deleteDialog.category)}
                title="カテゴリを削除"
                message={`「${deleteDialog.category?.name}」を削除してもよろしいですか？関連する支出データも削除されます。`}
                confirmText="削除"
                type="danger"
            />
        </div>
    );
};

export default CategoryManagement;