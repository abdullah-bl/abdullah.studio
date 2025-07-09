

import { llm_system_characters } from "@/lib/characters";
import { useChatStore } from "@/stores/chat";
import React from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { ScrollArea } from "../ui/scroll-area";



export default function ChatCharacters() {
    const characters = llm_system_characters;
    const {
        selectedCharacter,
        setSelectedCharacter,
        customCharacters,
        addCustomCharacter,
        updateCustomCharacter,
        deleteCustomCharacter,
        setSystemPrompt
    } = useChatStore();

    const [showCustomForm, setShowCustomForm] = React.useState(false);
    const [editingCharacter, setEditingCharacter] = React.useState<string | null>(null);
    const [customForm, setCustomForm] = React.useState({
        icon: '',
        name: '',
        description: '',
        system_prompt: ''
    });

    const handleCharacterSelect = (characterName: string) => {
        setSelectedCharacter(characterName);
        const character = characters.find(c => c.name === characterName);
        if (character) {
            setSystemPrompt(character.system_prompt);
        }
    };

    const handleCustomCharacterSelect = (characterId: string) => {
        setSelectedCharacter(characterId);
        const character = customCharacters.find(c => c.id === characterId);
        if (character) {
            setSystemPrompt(character.system_prompt);
        }
    };

    const handleCustomSubmit = () => {
        if (editingCharacter) {
            updateCustomCharacter(editingCharacter, customForm);
            setEditingCharacter(null);
        } else {
            addCustomCharacter(customForm);
        }
        setCustomForm({ icon: '', name: '', description: '', system_prompt: '' });
        setShowCustomForm(false);
    };

    const handleEditCustom = (character: any) => {
        setEditingCharacter(character.id);
        setCustomForm({
            icon: character.icon,
            name: character.name,
            description: character.description,
            system_prompt: character.system_prompt
        });
        setShowCustomForm(true);
    };

    const handleDeleteCustom = (characterId: string) => {
        deleteCustomCharacter(characterId);
        if (selectedCharacter === characterId) {
            setSelectedCharacter(null);
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <h3 className="text-md font-semibold">Chat Characters</h3>
                <button
                    onClick={() => setShowCustomForm(true)}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Add Custom
                </button>
            </div>

            {/* Predefined Characters */}
            <div className=" w-sm whitespace-nowrap overflow-x-auto">

                <div className="flex w-max space-x-2 p-4">
                    <div
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${selectedCharacter === null
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-md'
                            : 'border-gray-200 hover:border-gray-300'
                            }`}
                        onClick={() => setSelectedCharacter(null)}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                                <span className="text-lg">⚙️</span>
                            </div>
                            <div>
                                <h5 className="font-medium text-sm">Custom System Prompt</h5>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Use your own custom system prompt
                                </p>
                            </div>
                        </div>
                    </div>
                    {characters.map((character) => (
                        <div
                            key={character.name}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md min-w-[200px] max-w-[250px] ${selectedCharacter === character.name
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-md'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                            onClick={() => handleCharacterSelect(character.name)}
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-lg">{character.icon}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h5 className="font-medium text-sm truncate">{character.name}</h5>
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                        {character.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Custom Characters */}
            {
                customCharacters.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="font-medium text-sm text-muted-foreground">Your Custom Characters</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 overflow-x-auto">
                            {customCharacters.map((character) => (
                                <div
                                    key={character.id}
                                    className={`p-4 border-2 rounded-lg transition-all hover:shadow-md min-w-[200px] max-w-[250px] ${selectedCharacter === character.id
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-md'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-teal-100 dark:from-green-900 dark:to-teal-900 rounded-full flex items-center justify-center flex-shrink-0">
                                            <span className="text-lg">✨</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between">
                                                <div
                                                    className="flex-1 cursor-pointer"
                                                    onClick={() => handleCustomCharacterSelect(character.id)}
                                                >
                                                    <h5 className="font-medium text-sm truncate">{character.name}</h5>
                                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                        {character.description}
                                                    </p>
                                                </div>
                                                <div className="flex gap-1 ml-2 flex-shrink-0">
                                                    <button
                                                        onClick={() => handleEditCustom(character)}
                                                        className="p-1 text-xs text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCustom(character.id)}
                                                        className="p-1 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 rounded"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }

            {/* Custom Character Form */}
            {
                showCustomForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
                            <h3 className="text-lg font-semibold mb-4">
                                {editingCharacter ? 'Edit Character' : 'Add Custom Character'}
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="char-name">Name</Label>
                                    <Input
                                        id="char-name"
                                        value={customForm.name}
                                        onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                                        placeholder="Character name"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="char-description">Description</Label>
                                    <Input
                                        id="char-description"
                                        value={customForm.description}
                                        onChange={(e) => setCustomForm({ ...customForm, description: e.target.value })}
                                        placeholder="Brief description of the character"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="char-prompt">System Prompt</Label>
                                    <Textarea
                                        id="char-prompt"
                                        value={customForm.system_prompt}
                                        onChange={(e) => setCustomForm({ ...customForm, system_prompt: e.target.value })}
                                        placeholder="Enter the system prompt that defines this character's behavior..."
                                        rows={4}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 mt-6">
                                <button
                                    onClick={handleCustomSubmit}
                                    disabled={!customForm.name || !customForm.system_prompt}
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                                >
                                    {editingCharacter ? 'Update' : 'Add'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowCustomForm(false);
                                        setEditingCharacter(null);
                                        setCustomForm({ icon: '', name: '', description: '', system_prompt: '' });
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};
