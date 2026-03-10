export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      cash_flow_projects: {
        Row: {
          client_name: string | null
          created_at: string
          end_date: string | null
          id: string
          monthly_value: number
          name: string
          notes: string | null
          project_type: string
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_name?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          monthly_value?: number
          name: string
          notes?: string | null
          project_type?: string
          start_date: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_name?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          monthly_value?: number
          name?: string
          notes?: string | null
          project_type?: string
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      commissions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          month: number
          person_id: string
          user_id: string
          value: number
          year: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          month: number
          person_id: string
          user_id: string
          value?: number
          year: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          month?: number
          person_id?: string
          user_id?: string
          value?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "commissions_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_ai_logs: {
        Row: {
          action: string
          contract_id: string | null
          created_at: string
          id: string
          prompt: string | null
          response: string | null
          user_id: string
        }
        Insert: {
          action: string
          contract_id?: string | null
          created_at?: string
          id?: string
          prompt?: string | null
          response?: string | null
          user_id: string
        }
        Update: {
          action?: string
          contract_id?: string | null
          created_at?: string
          id?: string
          prompt?: string | null
          response?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_ai_logs_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_analyses: {
        Row: {
          analysis_result: Json | null
          compliance_score: number | null
          created_at: string
          extracted_text: string | null
          file_name: string
          file_url: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          analysis_result?: Json | null
          compliance_score?: number | null
          created_at?: string
          extracted_text?: string | null
          file_name: string
          file_url: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          analysis_result?: Json | null
          compliance_score?: number | null
          created_at?: string
          extracted_text?: string | null
          file_name?: string
          file_url?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      contract_signers: {
        Row: {
          clicksign_signer_key: string | null
          contract_id: string
          cpf: string | null
          created_at: string
          email: string
          id: string
          name: string
          request_signature_key: string | null
          role: string | null
          sign_order: number | null
          signed_at: string | null
          user_id: string
        }
        Insert: {
          clicksign_signer_key?: string | null
          contract_id: string
          cpf?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          request_signature_key?: string | null
          role?: string | null
          sign_order?: number | null
          signed_at?: string | null
          user_id: string
        }
        Update: {
          clicksign_signer_key?: string | null
          contract_id?: string
          cpf?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          request_signature_key?: string | null
          role?: string | null
          sign_order?: number | null
          signed_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_signers_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_templates: {
        Row: {
          category: Database["public"]["Enums"]["contract_category"]
          contract_type: Database["public"]["Enums"]["contract_type"]
          created_at: string
          description: string | null
          file_name: string
          file_url: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["contract_category"]
          contract_type: Database["public"]["Enums"]["contract_type"]
          created_at?: string
          description?: string | null
          file_name: string
          file_url: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["contract_category"]
          contract_type?: Database["public"]["Enums"]["contract_type"]
          created_at?: string
          description?: string | null
          file_name?: string
          file_url?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contract_versions: {
        Row: {
          change_description: string | null
          content: string
          contract_id: string
          created_at: string
          id: string
          user_id: string
          version_number: number
        }
        Insert: {
          change_description?: string | null
          content: string
          contract_id: string
          created_at?: string
          id?: string
          user_id: string
          version_number?: number
        }
        Update: {
          change_description?: string | null
          content?: string
          contract_id?: string
          created_at?: string
          id?: string
          user_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "contract_versions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          category: Database["public"]["Enums"]["contract_category"]
          clicksign_document_key: string | null
          clicksign_status: string | null
          company_address: string | null
          company_cnpj: string | null
          company_nome_fantasia: string | null
          company_razao_social: string | null
          company_representative: string | null
          company_representative_cpf: string | null
          company_representative_role: string | null
          compliance_score: number | null
          contract_duration: string | null
          contract_type: Database["public"]["Enums"]["contract_type"]
          contract_value: number | null
          contractor_address: string | null
          contractor_bank_details: string | null
          contractor_cnpj: string | null
          contractor_pix: string | null
          contractor_razao_social: string | null
          contractor_representative: string | null
          contractor_representative_cpf: string | null
          contractor_tax_regime: string | null
          created_at: string
          end_date: string | null
          final_pdf_url: string | null
          generated_content: string | null
          has_confidentiality: boolean | null
          has_exclusivity: boolean | null
          has_intellectual_property: boolean | null
          id: string
          notes: string | null
          payment_method: string | null
          salary_adjustment_id: string | null
          scope_summary: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["contract_status"]
          template_id: string | null
          termination_penalty: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["contract_category"]
          clicksign_document_key?: string | null
          clicksign_status?: string | null
          company_address?: string | null
          company_cnpj?: string | null
          company_nome_fantasia?: string | null
          company_razao_social?: string | null
          company_representative?: string | null
          company_representative_cpf?: string | null
          company_representative_role?: string | null
          compliance_score?: number | null
          contract_duration?: string | null
          contract_type: Database["public"]["Enums"]["contract_type"]
          contract_value?: number | null
          contractor_address?: string | null
          contractor_bank_details?: string | null
          contractor_cnpj?: string | null
          contractor_pix?: string | null
          contractor_razao_social?: string | null
          contractor_representative?: string | null
          contractor_representative_cpf?: string | null
          contractor_tax_regime?: string | null
          created_at?: string
          end_date?: string | null
          final_pdf_url?: string | null
          generated_content?: string | null
          has_confidentiality?: boolean | null
          has_exclusivity?: boolean | null
          has_intellectual_property?: boolean | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          salary_adjustment_id?: string | null
          scope_summary?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          template_id?: string | null
          termination_penalty?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["contract_category"]
          clicksign_document_key?: string | null
          clicksign_status?: string | null
          company_address?: string | null
          company_cnpj?: string | null
          company_nome_fantasia?: string | null
          company_razao_social?: string | null
          company_representative?: string | null
          company_representative_cpf?: string | null
          company_representative_role?: string | null
          compliance_score?: number | null
          contract_duration?: string | null
          contract_type?: Database["public"]["Enums"]["contract_type"]
          contract_value?: number | null
          contractor_address?: string | null
          contractor_bank_details?: string | null
          contractor_cnpj?: string | null
          contractor_pix?: string | null
          contractor_razao_social?: string | null
          contractor_representative?: string | null
          contractor_representative_cpf?: string | null
          contractor_tax_regime?: string | null
          created_at?: string
          end_date?: string | null
          final_pdf_url?: string | null
          generated_content?: string | null
          has_confidentiality?: boolean | null
          has_exclusivity?: boolean | null
          has_intellectual_property?: boolean | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          salary_adjustment_id?: string | null
          scope_summary?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          template_id?: string | null
          termination_penalty?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_salary_adjustment_id_fkey"
            columns: ["salary_adjustment_id"]
            isOneToOne: false
            referencedRelation: "salary_adjustments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "contract_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      fixed_costs: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean
          item_name: string
          monthly_value: number
          notes: string | null
          periodicity: string
          status: string
          subcategory: string
          target_value: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_active?: boolean
          item_name: string
          monthly_value?: number
          notes?: string | null
          periodicity?: string
          status?: string
          subcategory: string
          target_value?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          item_name?: string
          monthly_value?: number
          notes?: string | null
          periodicity?: string
          status?: string
          subcategory?: string
          target_value?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      granatum_categorias: {
        Row: {
          ativo: boolean
          cor: string | null
          descricao: string
          id: number
          parent_id: number | null
          synced_at: string
          tipo_categoria_id: number
          user_id: string
        }
        Insert: {
          ativo?: boolean
          cor?: string | null
          descricao: string
          id: number
          parent_id?: number | null
          synced_at?: string
          tipo_categoria_id: number
          user_id: string
        }
        Update: {
          ativo?: boolean
          cor?: string | null
          descricao?: string
          id?: number
          parent_id?: number | null
          synced_at?: string
          tipo_categoria_id?: number
          user_id?: string
        }
        Relationships: []
      }
      granatum_centros_custo: {
        Row: {
          ativo: boolean
          descricao: string
          id: number
          synced_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          descricao: string
          id: number
          synced_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          descricao?: string
          id?: number
          synced_at?: string
          user_id?: string
        }
        Relationships: []
      }
      granatum_contas: {
        Row: {
          ativo: boolean
          descricao: string
          id: number
          saldo: number
          synced_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          descricao: string
          id: number
          saldo?: number
          synced_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          descricao?: string
          id?: number
          saldo?: number
          synced_at?: string
          user_id?: string
        }
        Relationships: []
      }
      granatum_lancamentos: {
        Row: {
          categoria_id: number | null
          centro_custo_lucro_id: number | null
          conta_id: number | null
          data_competencia: string | null
          data_pagamento: string | null
          data_vencimento: string | null
          descricao: string
          id: number
          observacao: string | null
          pessoa_id: number | null
          status: string
          synced_at: string
          tipo_lancamento_id: number
          user_id: string
          valor: number
        }
        Insert: {
          categoria_id?: number | null
          centro_custo_lucro_id?: number | null
          conta_id?: number | null
          data_competencia?: string | null
          data_pagamento?: string | null
          data_vencimento?: string | null
          descricao: string
          id: number
          observacao?: string | null
          pessoa_id?: number | null
          status: string
          synced_at?: string
          tipo_lancamento_id: number
          user_id: string
          valor: number
        }
        Update: {
          categoria_id?: number | null
          centro_custo_lucro_id?: number | null
          conta_id?: number | null
          data_competencia?: string | null
          data_pagamento?: string | null
          data_vencimento?: string | null
          descricao?: string
          id?: number
          observacao?: string | null
          pessoa_id?: number | null
          status?: string
          synced_at?: string
          tipo_lancamento_id?: number
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      granatum_pessoas: {
        Row: {
          ativo: boolean
          documento: string | null
          email: string | null
          id: number
          is_cliente: boolean
          is_fornecedor: boolean
          nome: string
          nome_fantasia: string | null
          synced_at: string
          telefone: string | null
          user_id: string
        }
        Insert: {
          ativo?: boolean
          documento?: string | null
          email?: string | null
          id: number
          is_cliente?: boolean
          is_fornecedor?: boolean
          nome: string
          nome_fantasia?: string | null
          synced_at?: string
          telefone?: string | null
          user_id: string
        }
        Update: {
          ativo?: boolean
          documento?: string | null
          email?: string | null
          id?: number
          is_cliente?: boolean
          is_fornecedor?: boolean
          nome?: string
          nome_fantasia?: string | null
          synced_at?: string
          telefone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      granatum_sync_log: {
        Row: {
          completed_at: string | null
          endpoint: string
          error_message: string | null
          id: string
          records_synced: number
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          endpoint: string
          error_message?: string | null
          id?: string
          records_synced?: number
          started_at?: string
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          endpoint?: string
          error_message?: string | null
          id?: string
          records_synced?: number
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      invoice_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          invoice_request_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          invoice_request_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          invoice_request_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_comments_invoice_request_id_fkey"
            columns: ["invoice_request_id"]
            isOneToOne: false
            referencedRelation: "invoice_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_requests: {
        Row: {
          analyst_notes: string | null
          cancelled_at: string | null
          client_address: string
          client_city: string | null
          client_contact: string | null
          client_document: string
          client_email: string
          client_inscricao_municipal: string | null
          client_name: string
          client_state: string | null
          competency_month: number
          competency_year: number
          contract_attachment_url: string | null
          cost_center: Database["public"]["Enums"]["cost_center"]
          created_at: string
          description: string
          desired_issue_date: string
          due_date: string
          financial_category: Database["public"]["Enums"]["financial_category"]
          gross_value: number
          id: string
          invoice_pdf_url: string | null
          invoice_xml_url: string | null
          is_recurring: boolean
          issued_at: string | null
          payment_confirmed_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          recurring_day: number | null
          recurring_end_date: string | null
          revenue_type: Database["public"]["Enums"]["revenue_type"]
          sent_to_analyst_at: string | null
          sent_to_client_at: string | null
          show_bank_details: boolean
          status: Database["public"]["Enums"]["invoice_request_status"]
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analyst_notes?: string | null
          cancelled_at?: string | null
          client_address: string
          client_city?: string | null
          client_contact?: string | null
          client_document: string
          client_email: string
          client_inscricao_municipal?: string | null
          client_name: string
          client_state?: string | null
          competency_month: number
          competency_year: number
          contract_attachment_url?: string | null
          cost_center: Database["public"]["Enums"]["cost_center"]
          created_at?: string
          description: string
          desired_issue_date: string
          due_date: string
          financial_category: Database["public"]["Enums"]["financial_category"]
          gross_value: number
          id?: string
          invoice_pdf_url?: string | null
          invoice_xml_url?: string | null
          is_recurring?: boolean
          issued_at?: string | null
          payment_confirmed_at?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          recurring_day?: number | null
          recurring_end_date?: string | null
          revenue_type: Database["public"]["Enums"]["revenue_type"]
          sent_to_analyst_at?: string | null
          sent_to_client_at?: string | null
          show_bank_details?: boolean
          status?: Database["public"]["Enums"]["invoice_request_status"]
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analyst_notes?: string | null
          cancelled_at?: string | null
          client_address?: string
          client_city?: string | null
          client_contact?: string | null
          client_document?: string
          client_email?: string
          client_inscricao_municipal?: string | null
          client_name?: string
          client_state?: string | null
          competency_month?: number
          competency_year?: number
          contract_attachment_url?: string | null
          cost_center?: Database["public"]["Enums"]["cost_center"]
          created_at?: string
          description?: string
          desired_issue_date?: string
          due_date?: string
          financial_category?: Database["public"]["Enums"]["financial_category"]
          gross_value?: number
          id?: string
          invoice_pdf_url?: string | null
          invoice_xml_url?: string | null
          is_recurring?: boolean
          issued_at?: string | null
          payment_confirmed_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          recurring_day?: number | null
          recurring_end_date?: string | null
          revenue_type?: Database["public"]["Enums"]["revenue_type"]
          sent_to_analyst_at?: string | null
          sent_to_client_at?: string | null
          show_bank_details?: boolean
          status?: Database["public"]["Enums"]["invoice_request_status"]
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      invoice_status_history: {
        Row: {
          changed_by: string
          created_at: string
          id: string
          invoice_request_id: string
          justification: string | null
          new_status: Database["public"]["Enums"]["invoice_request_status"]
          old_status:
          | Database["public"]["Enums"]["invoice_request_status"]
          | null
        }
        Insert: {
          changed_by: string
          created_at?: string
          id?: string
          invoice_request_id: string
          justification?: string | null
          new_status: Database["public"]["Enums"]["invoice_request_status"]
          old_status?:
          | Database["public"]["Enums"]["invoice_request_status"]
          | null
        }
        Update: {
          changed_by?: string
          created_at?: string
          id?: string
          invoice_request_id?: string
          justification?: string | null
          new_status?: Database["public"]["Enums"]["invoice_request_status"]
          old_status?:
          | Database["public"]["Enums"]["invoice_request_status"]
          | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_status_history_invoice_request_id_fkey"
            columns: ["invoice_request_id"]
            isOneToOne: false
            referencedRelation: "invoice_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_items: {
        Row: {
          adjustment_reason: string | null
          adjustments: number
          base_value: number
          bonus: number
          bonus_reason: string | null
          created_at: string
          debit_note: boolean
          debit_note_reason: string | null
          holerite_emitido: boolean
          id: string
          nf_share_token: string | null
          nf_status: string
          nf_url: string | null
          payroll_id: string
          person_id: string
          reimbursements: number
          total_value: number
          user_id: string
        }
        Insert: {
          adjustment_reason?: string | null
          adjustments?: number
          base_value?: number
          bonus?: number
          bonus_reason?: string | null
          created_at?: string
          debit_note?: boolean
          debit_note_reason?: string | null
          holerite_emitido?: boolean
          id?: string
          nf_share_token?: string | null
          nf_status?: string
          nf_url?: string | null
          payroll_id: string
          person_id: string
          reimbursements?: number
          total_value?: number
          user_id: string
        }
        Update: {
          adjustment_reason?: string | null
          adjustments?: number
          base_value?: number
          bonus?: number
          bonus_reason?: string | null
          created_at?: string
          debit_note?: boolean
          debit_note_reason?: string | null
          holerite_emitido?: boolean
          id?: string
          nf_share_token?: string | null
          nf_status?: string
          nf_url?: string | null
          payroll_id?: string
          person_id?: string
          reimbursements?: number
          total_value?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_items_payroll_id_fkey"
            columns: ["payroll_id"]
            isOneToOne: false
            referencedRelation: "payroll_sheets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_items_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_nf_validations: {
        Row: {
          created_at: string
          expected_value: number | null
          extracted_cnpj: string | null
          extracted_date: string | null
          extracted_value: number | null
          file_url: string | null
          id: string
          payroll_item_id: string
          user_id: string
          validation_notes: string | null
          validation_status: string
        }
        Insert: {
          created_at?: string
          expected_value?: number | null
          extracted_cnpj?: string | null
          extracted_date?: string | null
          extracted_value?: number | null
          file_url?: string | null
          id?: string
          payroll_item_id: string
          user_id: string
          validation_notes?: string | null
          validation_status?: string
        }
        Update: {
          created_at?: string
          expected_value?: number | null
          extracted_cnpj?: string | null
          extracted_date?: string | null
          extracted_value?: number | null
          file_url?: string | null
          id?: string
          payroll_item_id?: string
          user_id?: string
          validation_notes?: string | null
          validation_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_nf_validations_payroll_item_id_fkey"
            columns: ["payroll_item_id"]
            isOneToOne: false
            referencedRelation: "payroll_items"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_sheets: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          month: number
          notes: string | null
          paid_at: string | null
          rejection_reason: string | null
          status: string
          total_value: number
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          month: number
          notes?: string | null
          paid_at?: string | null
          rejection_reason?: string | null
          status?: string
          total_value?: number
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          month?: number
          notes?: string | null
          paid_at?: string | null
          rejection_reason?: string | null
          status?: string
          total_value?: number
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      payroll_status_history: {
        Row: {
          changed_by: string
          created_at: string
          id: string
          justification: string | null
          new_status: string
          old_status: string | null
          payroll_id: string
        }
        Insert: {
          changed_by: string
          created_at?: string
          id?: string
          justification?: string | null
          new_status: string
          old_status?: string | null
          payroll_id: string
        }
        Update: {
          changed_by?: string
          created_at?: string
          id?: string
          justification?: string | null
          new_status?: string
          old_status?: string | null
          payroll_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_status_history_payroll_id_fkey"
            columns: ["payroll_id"]
            isOneToOne: false
            referencedRelation: "payroll_sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          address: string | null
          admission_date: string | null
          base_salary: number
          cnpj: string | null
          contract_type: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          nome_fantasia: string | null
          notes: string | null
          phone: string | null
          razao_social: string | null
          role: string
          status: string
          status_justification: string | null
          tax_regime: string | null
          termination_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          admission_date?: string | null
          base_salary?: number
          cnpj?: string | null
          contract_type?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          nome_fantasia?: string | null
          notes?: string | null
          phone?: string | null
          razao_social?: string | null
          role?: string
          status?: string
          status_justification?: string | null
          tax_regime?: string | null
          termination_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          admission_date?: string | null
          base_salary?: number
          cnpj?: string | null
          contract_type?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          nome_fantasia?: string | null
          notes?: string | null
          phone?: string | null
          razao_social?: string | null
          role?: string
          status?: string
          status_justification?: string | null
          tax_regime?: string | null
          termination_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pj_absences: {
        Row: {
          absence_type: string
          approved_by: string | null
          created_at: string
          days_count: number
          end_date: string
          id: string
          person_id: string
          reason: string | null
          start_date: string
          status: string
          user_id: string
        }
        Insert: {
          absence_type?: string
          approved_by?: string | null
          created_at?: string
          days_count?: number
          end_date: string
          id?: string
          person_id: string
          reason?: string | null
          start_date: string
          status?: string
          user_id: string
        }
        Update: {
          absence_type?: string
          approved_by?: string | null
          created_at?: string
          days_count?: number
          end_date?: string
          id?: string
          person_id?: string
          reason?: string | null
          start_date?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pj_absences_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      pj_contracts: {
        Row: {
          contract_type: string
          created_at: string
          end_date: string | null
          file_url: string | null
          id: string
          monthly_value: number
          notes: string | null
          person_id: string
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contract_type?: string
          created_at?: string
          end_date?: string | null
          file_url?: string | null
          id?: string
          monthly_value?: number
          notes?: string | null
          person_id: string
          start_date: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contract_type?: string
          created_at?: string
          end_date?: string | null
          file_url?: string | null
          id?: string
          monthly_value?: number
          notes?: string | null
          person_id?: string
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pj_contracts_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      pj_portal_profiles: {
        Row: {
          auth_user_id: string
          created_at: string
          id: string
          person_id: string
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          id?: string
          person_id: string
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          id?: string
          person_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pj_portal_profiles_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      reimbursement_policies: {
        Row: {
          avg_payment_days: number
          category_limits: Json
          id: string
          max_request_days: number
          non_reimbursable_items: string[]
          policy_document_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_payment_days?: number
          category_limits?: Json
          id?: string
          max_request_days?: number
          non_reimbursable_items?: string[]
          policy_document_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_payment_days?: number
          category_limits?: Json
          id?: string
          max_request_days?: number
          non_reimbursable_items?: string[]
          policy_document_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reimbursement_requests: {
        Row: {
          account_number: string | null
          agency: string | null
          amount: number
          approval_notes: string | null
          approver_name: string | null
          bank_name: string | null
          category: string
          cost_center: string
          cpf_holder: string | null
          created_at: string
          department: string
          description: string
          expense_date: string
          id: string
          paid_at: string | null
          paid_by: string | null
          payment_method: string
          pix_key: string | null
          protocol_number: string
          receipt_url: string | null
          rejection_reason: string | null
          requester_email: string
          requester_name: string
          role_title: string
          scheduled_payment_date: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          account_number?: string | null
          agency?: string | null
          amount: number
          approval_notes?: string | null
          approver_name?: string | null
          bank_name?: string | null
          category: string
          cost_center?: string
          cpf_holder?: string | null
          created_at?: string
          department: string
          description: string
          expense_date: string
          id?: string
          paid_at?: string | null
          paid_by?: string | null
          payment_method?: string
          pix_key?: string | null
          protocol_number: string
          receipt_url?: string | null
          rejection_reason?: string | null
          requester_email: string
          requester_name: string
          role_title: string
          scheduled_payment_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          account_number?: string | null
          agency?: string | null
          amount?: number
          approval_notes?: string | null
          approver_name?: string | null
          bank_name?: string | null
          category?: string
          cost_center?: string
          cpf_holder?: string | null
          created_at?: string
          department?: string
          description?: string
          expense_date?: string
          id?: string
          paid_at?: string | null
          paid_by?: string | null
          payment_method?: string
          pix_key?: string | null
          protocol_number?: string
          receipt_url?: string | null
          rejection_reason?: string | null
          requester_email?: string
          requester_name?: string
          role_title?: string
          scheduled_payment_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      reimbursement_status_history: {
        Row: {
          changed_by: string
          created_at: string
          id: string
          justification: string | null
          new_status: string
          old_status: string | null
          reimbursement_id: string
        }
        Insert: {
          changed_by: string
          created_at?: string
          id?: string
          justification?: string | null
          new_status: string
          old_status?: string | null
          reimbursement_id: string
        }
        Update: {
          changed_by?: string
          created_at?: string
          id?: string
          justification?: string | null
          new_status?: string
          old_status?: string | null
          reimbursement_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reimbursement_status_history_reimbursement_id_fkey"
            columns: ["reimbursement_id"]
            isOneToOne: false
            referencedRelation: "reimbursement_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_projections: {
        Row: {
          client_name: string
          color: string | null
          created_at: string
          id: string
          is_mrr: boolean
          month: number
          notes: string | null
          updated_at: string
          user_id: string
          value: number
          year: number
        }
        Insert: {
          client_name: string
          color?: string | null
          created_at?: string
          id?: string
          is_mrr?: boolean
          month: number
          notes?: string | null
          updated_at?: string
          user_id: string
          value?: number
          year: number
        }
        Update: {
          client_name?: string
          color?: string | null
          created_at?: string
          id?: string
          is_mrr?: boolean
          month?: number
          notes?: string | null
          updated_at?: string
          user_id?: string
          value?: number
          year?: number
        }
        Relationships: []
      }
      salary_adjustments: {
        Row: {
          change_percentage: number
          created_at: string
          effective_date: string
          id: string
          new_value: number
          old_value: number
          person_id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          change_percentage?: number
          created_at?: string
          effective_date?: string
          id?: string
          new_value?: number
          old_value?: number
          person_id: string
          reason?: string | null
          user_id: string
        }
        Update: {
          change_percentage?: number
          created_at?: string
          effective_date?: string
          id?: string
          new_value?: number
          old_value?: number
          person_id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "salary_adjustments_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_history: {
        Row: {
          created_at: string
          id: string
          month: number
          notes: string | null
          person_id: string
          user_id: string
          value: number
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          month: number
          notes?: string | null
          person_id: string
          user_id: string
          value?: number
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          month?: number
          notes?: string | null
          person_id?: string
          user_id?: string
          value?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "salary_history_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_invoice_status_history: {
        Row: {
          changed_by: string
          created_at: string
          id: string
          justification: string | null
          new_status: string
          old_status: string | null
          supplier_invoice_id: string
        }
        Insert: {
          changed_by: string
          created_at?: string
          id?: string
          justification?: string | null
          new_status: string
          old_status?: string | null
          supplier_invoice_id: string
        }
        Update: {
          changed_by?: string
          created_at?: string
          id?: string
          justification?: string | null
          new_status?: string
          old_status?: string | null
          supplier_invoice_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_invoice_status_history_supplier_invoice_id_fkey"
            columns: ["supplier_invoice_id"]
            isOneToOne: false
            referencedRelation: "supplier_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_invoices: {
        Row: {
          approved_at: string | null
          category: string
          competency_month: number
          competency_year: number
          contested_at: string | null
          cost_center: string
          created_at: string
          description: string
          due_date: string | null
          gross_value: number
          id: string
          invoice_pdf_url: string | null
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          share_token: string | null
          status: string
          submitted_via: string
          supplier_contact: string | null
          supplier_document: string
          supplier_email: string | null
          supplier_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          category?: string
          competency_month: number
          competency_year: number
          contested_at?: string | null
          cost_center?: string
          created_at?: string
          description: string
          due_date?: string | null
          gross_value: number
          id?: string
          invoice_pdf_url?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          share_token?: string | null
          status?: string
          submitted_via?: string
          supplier_contact?: string | null
          supplier_document: string
          supplier_email?: string | null
          supplier_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          category?: string
          competency_month?: number
          competency_year?: number
          contested_at?: string | null
          cost_center?: string
          created_at?: string
          description?: string
          due_date?: string | null
          gross_value?: number
          id?: string
          invoice_pdf_url?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          share_token?: string | null
          status?: string
          submitted_via?: string
          supplier_contact?: string | null
          supplier_document?: string
          supplier_email?: string | null
          supplier_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_pj_person_id: { Args: never; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "secretary"
      contract_category: "cliente" | "consultor_parceiro" | "pj" | "contabilidade"
      contract_status:
      | "rascunho"
      | "em_revisao"
      | "aprovado"
      | "enviado_assinatura"
      | "assinado_parcialmente"
      | "assinado"
      | "cancelado"
      contract_type:
      | "rh_as_a_service"
      | "consultoria_rh"
      | "comunicacao_interna"
      | "contrato_vagas"
      | "parceiro_geral"
      | "parceiro_projeto"
      | "prestacao_servicos"
      | "aditivo_contratual"
      | "distrato"
      | "propriedade_intelectual"
      | "servicos_contabeis"
      | "servicos_extraordinarios"
      | "assessoria_contabil"
      cost_center: "operacoes" | "comercial" | "marketing"
      financial_category:
      | "receita_servico"
      | "receita_parceria"
      | "receita_treinamento"
      invoice_request_status:
      | "rascunho"
      | "enviada_analista"
      | "emissao_andamento"
      | "emitida"
      | "enviada_cliente"
      | "pagamento_confirmado"
      | "cancelada"
      payment_method: "transferencia" | "pix" | "boleto" | "outro"
      revenue_type:
      | "consultoria_rh"
      | "rh_as_a_service"
      | "marketing_digital"
      | "treinamentos_workshops"
      | "comunicacao_interna"
      | "parceria_co_branding"
      | "outro"
      | "vagas"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "secretary"],
      contract_category: ["cliente", "consultor_parceiro", "pj", "contabilidade"],
      contract_status: [
        "rascunho",
        "em_revisao",
        "aprovado",
        "enviado_assinatura",
        "assinado_parcialmente",
        "assinado",
        "cancelado",
      ],
      contract_type: [
        "rh_as_a_service",
        "consultoria_rh",
        "comunicacao_interna",
        "contrato_vagas",
        "parceiro_geral",
        "parceiro_projeto",
        "prestacao_servicos",
        "aditivo_contratual",
        "distrato",
        "propriedade_intelectual",
        "servicos_contabeis",
        "servicos_extraordinarios",
        "assessoria_contabil",
      ],
      cost_center: ["operacoes", "comercial", "marketing"],
      financial_category: [
        "receita_servico",
        "receita_parceria",
        "receita_treinamento",
      ],
      invoice_request_status: [
        "rascunho",
        "enviada_analista",
        "emissao_andamento",
        "emitida",
        "enviada_cliente",
        "pagamento_confirmado",
        "cancelada",
      ],
      payment_method: ["transferencia", "pix", "boleto", "outro"],
      revenue_type: [
        "consultoria_rh",
        "rh_as_a_service",
        "marketing_digital",
        "treinamentos_workshops",
        "comunicacao_interna",
        "parceria_co_branding",
        "outro",
        "vagas",
      ],
    },
  },
} as const
